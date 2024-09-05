import { Injectable } from '@nestjs/common';
import { WorkflowQueryService } from './workflow-query.service';
import { GlobalShortcutService } from '../global-shortcut/global-shortcut.service';
import { KeyboardShortcutUtils } from '#packages/common/utils/KeyboardShortcutUtils';
import { OnAppReady } from '../common/hooks/on-app-ready.hook';
import path from 'path';
import { BrowserWindow, app, dialog } from 'electron';
import fs from 'fs-extra';
import {
  WorkflowFileModel,
  workflowFileValidation,
} from './workflow.validation';
import { LoggerService } from '../logger/logger.service';
import { fromZodError } from 'zod-validation-error';
import {
  WorkflowApiWithExtensions,
  WorkflowInsertPayload,
  WorkflowUpdatePayload,
} from './workflow.interface';
import { WORKFLOW_NODE_TYPE } from '@altdot/workflow/dist/const/workflow-nodes-type.const';
import type { WorkflowNodes } from '@altdot/workflow';
import { APIService } from '../api/api.service';
import { ApiExtensionHighlightItem } from '@altdot/shared';
import { ExtensionQueryService } from '../extension/extension-query.service';
import { WORKFLOW_LOGS_FOLDER } from '../common/utils/constant';
import { WorkflowRunnerService } from '../workflow-runner/workflow-runner.service';

@Injectable()
export class WorkflowService implements OnAppReady {
  constructor(
    private logger: LoggerService,
    private apiService: APIService,
    private workflowQuery: WorkflowQueryService,
    private workflowRunner: WorkflowRunnerService,
    private extensionQuery: ExtensionQueryService,
    private globalShortcut: GlobalShortcutService,
  ) {}

  async onAppReady() {
    this.registerAllWorkflowsTriggers();
    await fs.ensureDir(WORKFLOW_LOGS_FOLDER);
  }

  private async registerAllWorkflowsTriggers() {
    const workflows = await this.workflowQuery.listWorkflowTriggers();
    await Promise.allSettled(
      workflows.map(async (workflow) =>
        this.registerTriggers(
          workflow.id,
          workflow.triggers as WorkflowNodes[],
        ),
      ),
    );
  }

  unregisterTriggers(workflowId: string) {
    this.globalShortcut.unregisterById(`workflow:${workflowId}`);
  }

  registerTriggers(workflowId: string, nodes: WorkflowNodes[]) {
    for (const node of nodes) {
      switch (node.type) {
        case WORKFLOW_NODE_TYPE.TRIGGER_SHORTCUT: {
          if (node.data.shortcut) {
            this.globalShortcut.register({
              id: `workflow:${workflowId}`,
              keys: KeyboardShortcutUtils.toElectronShortcut(
                node.data.shortcut,
              ),
              callback: () => {
                this.workflowRunner.execute({
                  id: workflowId,
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

  async exportToFile(
    workflow: string | WorkflowFileModel,
    exportPath?: string,
    browserWindow?: BrowserWindow | null,
  ) {
    const workflowData =
      typeof workflow === 'string'
        ? await this.workflowQuery.getExportData(workflow)
        : workflow;
    if (!workflowData) throw new Error("Couldn't find workflow");

    let filePath = exportPath;
    if (!filePath) {
      const options: Electron.SaveDialogOptions = {
        title: 'Export workflow',
        buttonLabel: 'Save workflow',
        filters: [{ name: 'Workflow file', extensions: ['json'] }],
        defaultPath: path.join(
          app.getPath('documents'),
          `${workflowData.name}.json`,
        ),
      };
      const result = await (browserWindow
        ? dialog.showSaveDialog(browserWindow, options)
        : dialog.showSaveDialog(options));
      if (result.canceled || !result.filePath) return;

      filePath = result.filePath;
    }

    await fs.writeFile(filePath, JSON.stringify(workflowData));
  }

  async importFromFile(filePath?: string[]) {
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
            await workflowFileValidation.safeParseAsync(workflowJSON);

          if (!workflow.success) {
            this.logger.error(
              ['WorkflowService', 'import'],
              `(${path.basename(filePath)})`,
              fromZodError(workflow.error),
            );
            return;
          }

          await this.workflowQuery.insert(
            workflow.data as WorkflowInsertPayload,
          );
        }),
      );
    } catch (error) {
      this.logger.error(['WorkflowService', 'import'], error);
      throw error;
    }
  }

  async updateWorkflow(workflowId: string, payload: WorkflowUpdatePayload) {
    await this.workflowQuery.update(workflowId, payload);

    if (payload.triggers) {
      this.unregisterTriggers(workflowId);
      this.registerTriggers(workflowId, payload.triggers as WorkflowNodes[]);
    }
  }

  async getWorkflowWithExtDependency(
    workflowId: string,
  ): Promise<WorkflowApiWithExtensions> {
    const workflow = await this.apiService.workflows.get(workflowId);

    const extIds = new Set<string>();
    workflow.workflow.nodes.forEach((_node) => {
      const node = _node as WorkflowNodes;
      if (node.type !== WORKFLOW_NODE_TYPE.COMMAND || !node.data?.extension?.id)
        return;

      extIds.add(node.data.extension.id);
    });

    let missingExtensions: ApiExtensionHighlightItem[] = [];
    if (extIds.size === 0) return { workflow, missingExtensions };

    const notExistsExtIds = await this.extensionQuery
      .existsArr([...extIds])
      .then((result) => {
        return Object.entries(result).reduce<string[]>(
          (acc, [extId, exists]) => {
            if (!exists) acc.push(extId);

            return acc;
          },
          [],
        );
      });
    if (notExistsExtIds.length === 0) return { workflow, missingExtensions };

    missingExtensions =
      await this.apiService.extensions.getHighlights(notExistsExtIds);

    return { workflow, missingExtensions };
  }
}
