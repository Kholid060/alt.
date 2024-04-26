import type {
  WorkflowRunnerMessagePortEvents,
  WorkflowRunnerRunPayload,
} from '#packages/common/interface/workflow-runner.interace';
import BetterMessagePort from '#packages/common/utils/BetterMessagePort';
import type { WorkflowRunnerOptions } from './WorkflowRunner';
import WorkflowRunner from './WorkflowRunner';
import * as builtNodeHandlers from './node-handler/workflow-node-handlers';

const nodeHandlers = (() => {
  // const files = import.meta.glob('./node-handler/*.ts', {
  //   eager: true,
  // }) as Record<
  //   string,
  //   {
  //     default: WorkflowNodeHandler;
  //   }
  // >;
  const handlers: Record<string, unknown> = {};

  Object.values(builtNodeHandlers).forEach((handler) => {
    handlers[handler.type] = handler;
  });

  return handlers as WorkflowRunnerOptions['nodeHandlers'];
})();

class WorkflowRunnerManager {
  private static _instance: WorkflowRunnerManager | null = null;

  static get instance() {
    return this._instance || (this._instance = new WorkflowRunnerManager());
  }

  private workflowRunners: Map<string, WorkflowRunner> = new Map();

  constructor() {}

  runWorkflow(payload: WorkflowRunnerRunPayload) {
    const workflowRunner = new WorkflowRunner({ ...payload, nodeHandlers });
    this.workflowRunners.set(workflowRunner.id, workflowRunner);

    return workflowRunner.id;
  }
}

function onMessage({ data, ports }: Electron.MessageEvent) {
  if (data !== 'init' || !ports[0]) return;

  process.parentPort.removeListener('message', onMessage);

  const messagePort = new BetterMessagePort<WorkflowRunnerMessagePortEvents>(
    ports[0],
  );

  messagePort.async.on('workflow:run', (payload) => {
    return WorkflowRunnerManager.instance.runWorkflow(payload);
  });
}

process.parentPort.addListener('message', onMessage);
