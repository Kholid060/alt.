import type {
  WorkflowRunnerMessagePortEvents,
  WorkflowRunnerRunPayload,
} from '#packages/common/interface/workflow-runner.interace';
import BetterMessagePort from '#packages/common/utils/BetterMessagePort';
import WorkflowRunner from './WorkflowRunner';

class WorkflowRunnerManager {
  private static _instance: WorkflowRunnerManager | null = null;

  static get instance() {
    return this._instance || (this._instance = new WorkflowRunnerManager());
  }

  private workflowRunners: Map<string, WorkflowRunner> = new Map();

  constructor() {}

  runWorkflow(payload: WorkflowRunnerRunPayload) {
    const workflowRunner = new WorkflowRunner(payload);
    this.workflowRunners.set(workflowRunner.id, workflowRunner);

    workflowRunner.start();

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
