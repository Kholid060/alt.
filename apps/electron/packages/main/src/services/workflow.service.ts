import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/workflow.const';
import type {
  DatabaseWorkflowDetail,
  DatabaseWorkflowUpdatePayload,
} from '../interface/database.interface';
import GlobalShortcut from '../utils/GlobalShortcuts';
import DatabaseService from './database/database.service';
import { KeyboardShortcutUtils } from '#common/utils/KeyboardShortcutUtils';
import type {
  WorkflowEdge,
  WorkflowRunPayload,
} from '#packages/common/interface/workflow.interface';
import { app, dialog } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { logger } from '../lib/log';
import type { WorkflowNodes } from '#packages/common/interface/workflow-nodes.interface';
import WindowSharedProcess from '../window/shared-process-window';
import IPCMain from '../utils/ipc/IPCMain';
import TrayService from './tray.service';
import { APP_NAME } from '#packages/common/utils/constant/app.const';

class WorkflowTriggerService2 {
  constructor(private workflowService: WorkflowService2) {}

  async register(workflowId: string | DatabaseWorkflowDetail) {
    const workflow =
      typeof workflowId === 'string'
        ? await DatabaseService.instance.workflow.get(workflowId)
        : workflowId;
    if (!workflow) throw new Error('Workflow not found');

    for (const node of workflow.nodes) {
      switch (node.type) {
        case WORKFLOW_NODE_TYPE.TRIGGER_SHORTCUT: {
          if (node.data.shortcut) {
            GlobalShortcut.instance.register({
              id: `workflow:${workflow.id}`,
              keys: KeyboardShortcutUtils.toElectronShortcut(
                node.data.shortcut,
              ),
              callback: () => {
                this.workflowService.execute({
                  id: workflow.id,
                  startNodeId: node.id,
                });
              },
            });
          }
          break;
        }
      }
    }
  }

  async unregister(workflowId: string) {
    GlobalShortcut.instance.unregisterById(`workflow:${workflowId}`);
  }

  async reRegisterTriggers(workflowId: string | DatabaseWorkflowDetail) {
    const workflow =
      typeof workflowId === 'string'
        ? await DatabaseService.instance.workflow.get(workflowId)
        : workflowId;
    if (!workflow) throw new Error('Workflow not found');

    await this.unregister(workflow.id);
    await this.register(workflow);
  }

  async registerAll() {
    const workflows = await DatabaseService.instance.workflow.getAll();
    await Promise.allSettled(
      workflows.map(async (workflow) => this.register(workflow)),
    );
  }
}

export const workflowFileSchema = z.object({
  name: z.string().min(1),
  icon: z.string().min(1),
  nodes: z
    .object({
      id: z.string(),
      data: z.record(z.string(), z.unknown()),
      type: z.nativeEnum(WORKFLOW_NODE_TYPE),
      position: z.object({ x: z.number(), y: z.number() }),
    })
    .array(),
  edges: z
    .object({
      id: z.string(),
      source: z.string().nullable(),
      target: z.string().nullable(),
      sourceHandle: z.string().nullable(),
      targetHandle: z.string().nullable(),
    })
    .array(),
  viewport: z
    .object({
      x: z.number(),
      y: z.number(),
      zoom: z.number(),
    })
    .nullable()
    .optional(),
  description: z.string().default('').optional(),
});

class WorkflowService2 {
  private static _instance: WorkflowService2;

  static get instance() {
    return this._instance || (this._instance = new WorkflowService2());
  }

  trigger: WorkflowTriggerService2;
  private _runningWorkflows = new Map<
    string,
    { workflowId: string; runnerId: string }
  >();

  constructor() {
    this.trigger = new WorkflowTriggerService2(this);
  }

  async init() {
    await this.trigger.registerAll();
    await DatabaseService.instance.workflow.updateRunningWorkflows();

    IPCMain.on('workflow:running-change', (_, type, detail) => {
      if (type === 'running') {
        this._runningWorkflows.set(detail.runnerId, detail);
      } else {
        this._runningWorkflows.delete(detail.runnerId);
      }

      const suffix =
        this._runningWorkflows.size === 0
          ? ''
          : `(${this._runningWorkflows.size}) running workflows`;
      TrayService.instance.setTooltip(`${APP_NAME} ${suffix}`);
    });
  }

  get(workflowId: string) {
    return DatabaseService.instance.workflow.get(workflowId);
  }

  async execute(payload: WorkflowRunPayload) {
    const workflow = await DatabaseService.instance.workflow.get(payload.id);
    if (!workflow) throw new Error("Couldn't find workflow");
    if (workflow.isDisabled) return null;

    DatabaseService.instance.workflow.incExecuteCount(payload.id);

    return WindowSharedProcess.instance.invoke(
      { name: 'shared-window:execute-workflow', ensureWindow: true },
      {
        ...payload,
        workflow,
      },
    );
  }

  updateWorkflow(workflowId: string, payload: DatabaseWorkflowUpdatePayload) {
    return DatabaseService.instance.workflow.update(workflowId, payload);
  }

  async export(workflowId: string, window?: Electron.BrowserWindow) {
    const workflow =
      await DatabaseService.instance.workflow.getExportValue(workflowId);
    if (!workflow) throw new Error("Couldn't find workflow");

    const options: Electron.SaveDialogOptions = {
      title: 'Export workflow',
      buttonLabel: 'Save workflow',
      filters: [{ name: 'Workflow file', extensions: ['json'] }],
      defaultPath: path.join(app.getPath('documents'), `${workflow.name}.json`),
    };
    const result = await (window
      ? dialog.showSaveDialog(window, options)
      : dialog.showSaveDialog(options));
    if (result.canceled || !result.filePath) return;

    await fs.writeFile(result.filePath, JSON.stringify(workflow));
  }

  async import(filePath?: string[]) {
    try {
      let workflowsFilePath = filePath;
      if (!workflowsFilePath) {
        ({ filePaths: workflowsFilePath } = await dialog.showOpenDialog({
          buttonLabel: 'Import',
          title: 'Import workflow',
          filters: [
            {
              extensions: ['json'],
              name: 'Workflow file',
            },
          ],
          defaultPath: app.getPath('documents'),
        }));
        if (!workflowsFilePath) return;
      }

      await Promise.all(
        workflowsFilePath.map(async (filePath) => {
          const workflowJSON = await fs.readJSON(filePath);
          const workflow =
            await workflowFileSchema.safeParseAsync(workflowJSON);

          if (!workflow.success) {
            logger(
              'error',
              ['WorkflowService', 'import'],
              `(${path.basename(filePath)})`,
              fromZodError(workflow.error),
            );
            return;
          }

          type WorkflowFileType = z.infer<typeof workflowFileSchema> & {
            edges: WorkflowEdge[];
            nodes: WorkflowNodes[];
          };
          await DatabaseService.instance.workflow.insert(
            workflow.data as WorkflowFileType,
          );
        }),
      );
    } catch (error) {
      logger('error', ['WorkflowService', 'import'], error);
      throw error;
    }
  }

  stopRunningWorkflow(runnerId: string) {
    return WindowSharedProcess.instance.sendMessage(
      {
        name: 'shared-window:stop-execute-workflow',
        noThrow: true,
        ensureWindow: false,
      },
      runnerId,
    );
  }
}

export default WorkflowService2;
