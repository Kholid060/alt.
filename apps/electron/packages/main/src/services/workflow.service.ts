import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/workflow.const';
import type {
  DatabaseWorkflowDetail,
  DatabaseWorkflowUpdatePayload,
} from '../interface/database.interface';
import GlobalShortcut from '../utils/GlobalShortcuts';
import DBService from './database/database.service';
import { KeyboardShortcutUtils } from '#common/utils/KeyboardShortcutUtils';
import SharedProcessService from './shared-process.service';
import type {
  WorkflowEdge,
  WorkflowRunPayload,
} from '#packages/common/interface/workflow.interface';
import { app, dialog } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import type { SelectWorkflow } from '../db/schema/workflow.schema';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { logger } from '../lib/log';
import type { WorkflowNodes } from '#packages/common/interface/workflow-nodes.interface';

class WorkflowTriggerService {
  static async register(workflowId: string | DatabaseWorkflowDetail) {
    const workflow =
      typeof workflowId === 'string'
        ? await DBService.instance.workflow.get(workflowId)
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
                SharedProcessService.executeWorkflow({
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

  static async unregister(workflowId: string) {
    GlobalShortcut.instance.unregisterById(`workflow:${workflowId}`);
  }

  static async reRegisterTriggers(workflowId: string | DatabaseWorkflowDetail) {
    const workflow =
      typeof workflowId === 'string'
        ? await DBService.instance.workflow.get(workflowId)
        : workflowId;
    if (!workflow) throw new Error('Workflow not found');

    await this.unregister(workflow.id);
    await this.register(workflow);
  }

  static async registerAll() {
    const workflows = await DBService.instance.workflow.getAll();
    await Promise.allSettled(
      workflows.map(async (workflow) => this.register(workflow)),
    );
  }
}

const workflowFileSchema = z.object({
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

class WorkflowService {
  static get(workflowId: string) {
    return DBService.instance.workflow.get(workflowId);
  }

  static execute(payload: WorkflowRunPayload) {
    return SharedProcessService.executeWorkflow(payload);
  }

  static updateWorkflow(
    workflowId: string,
    payload: DatabaseWorkflowUpdatePayload,
  ) {
    return DBService.instance.workflow.update(workflowId, payload);
  }

  static async export(workflowId: string, window?: Electron.BrowserWindow) {
    const workflow = await this.get(workflowId);
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

    const deleteKeys: (keyof Required<SelectWorkflow>)[] = [
      'createdAt',
      'executeCount',
      'id',
      'isDisabled',
    ];
    deleteKeys.forEach((key) => {
      delete workflow[key];
    });

    await fs.writeFile(result.filePath, JSON.stringify(workflow));
  }

  static async import(filePath?: string[]) {
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
          await DBService.instance.workflow.insert(
            workflow.data as WorkflowFileType,
          );
        }),
      );
    } catch (error) {
      logger('error', ['WorkflowService', 'import'], error);
      throw error;
    }
  }

  static trigger = WorkflowTriggerService;
}

export default WorkflowService;
