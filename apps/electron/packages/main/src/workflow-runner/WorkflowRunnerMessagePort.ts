import type { WorkflowRunnerMessagePortAsyncEvents } from '#packages/common/interface/workflow-runner.interace';
import BetterMessagePort from '#packages/common/utils/BetterMessagePort';

class WorkflowRunnerMessagePort {
  private static _instance: WorkflowRunnerMessagePort;

  static get instance() {
    return this._instance || (this._instance = new WorkflowRunnerMessagePort());
  }

  messagePort: null | BetterMessagePort<WorkflowRunnerMessagePortAsyncEvents> | null;

  constructor() {
    this.messagePort = null;
  }

  updatePort(port: MessagePort) {
    if (this.messagePort) this.messagePort.destroy();
    this.messagePort = new BetterMessagePort(port);
  }
}

export default WorkflowRunnerMessagePort;
