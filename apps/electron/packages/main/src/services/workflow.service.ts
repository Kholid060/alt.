import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/workflow.const';
import type {
  DatabaseWorkflowDetail,
  DatabaseWorkflowUpdatePayload,
} from '../interface/database.interface';
import GlobalShortcut from '../utils/GlobalShortcuts';
import DBService from './database/database.service';
import { KeyboardShortcutUtils } from '#common/utils/KeyboardShortcutUtils';
import SharedProcessService from './shared-process.service';
import type { WorkflowRunPayload } from '#packages/common/interface/workflow.interface';

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

  static trigger = WorkflowTriggerService;
}

export default WorkflowService;
