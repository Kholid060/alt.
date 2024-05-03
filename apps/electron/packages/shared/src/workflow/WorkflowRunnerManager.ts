import type { WorkflowRunnerRunPayload } from '#packages/common/interface/workflow-runner.interace';
import { nanoid } from 'nanoid';
import type { NodeHandlersObj } from './runner/WorkflowRunner';
import WorkflowRunner from './runner/WorkflowRunner';
import * as nodeHandlersClasses from './node-handler';
import { debugLog } from '#packages/common/utils/helper';

class WorkflowRunnerManager {
  private static _instance: WorkflowRunnerManager;

  static get instance() {
    return this._instance || (this._instance = new WorkflowRunnerManager());
  }

  private runners: Map<string, WorkflowRunner> = new Map();

  constructor() {}

  execute({ startNodeId, workflow }: WorkflowRunnerRunPayload) {
    const runnerId = nanoid(5);

    const nodeHandlers = Object.values(nodeHandlersClasses).reduce<
      Record<string, unknown>
    >((acc, HandlerClass) => {
      const nodeHandler = new HandlerClass();
      acc[nodeHandler.type] = nodeHandler;

      return acc;
    }, {}) as NodeHandlersObj;

    const runner = new WorkflowRunner({
      workflow,
      startNodeId,
      nodeHandlers,
      id: runnerId,
    });
    runner.once('error', (message) => {
      debugLog(`Error on "${workflow.name}" workflow: ${message}`);
      runner.destroy();
      this.runners.delete(runnerId);
    });
    runner.once('finish', (reason) => {
      debugLog(`Finish "${workflow.name}" execution: ${reason}`);
      runner.destroy();
      this.runners.delete(runnerId);
    });

    runner.start();

    this.runners.set(runnerId, runner);

    return runnerId;
  }

  stop(runnerId: string) {
    if (!this.runners.has(runnerId)) return;

    this.runners.get(runnerId)?.stop();
    this.runners.delete(runnerId);
  }
}

export default WorkflowRunnerManager;
