import path from 'path';
import { MessageChannelMain, utilityProcess } from 'electron';
import type { WorkflowRunnerMessagePortAsyncEvents } from '#common/interface/workflow-runner.interace';
import type { WorkflowRunPayload } from '#packages/common/interface/workflow.interface';
import DBService from './database/database.service';
import { CustomError } from '#packages/common/errors/custom-errors';
import { __DIRNAME } from '/@/utils/constant';
import { BetterMessagePort } from '@repo/shared';

const workflowRunnerFilePath = path.join(__DIRNAME, './workflow-runner.js');

class WorkflowRunnerService {
  private static _instance: WorkflowRunnerService | null = null;

  static get instance() {
    return this._instance || (this._instance = new WorkflowRunnerService());
  }

  private runnerProcess: Electron.UtilityProcess | null = null;
  private messageChannel: MessageChannelMain = new MessageChannelMain();
  private messagePort: BetterMessagePort<WorkflowRunnerMessagePortAsyncEvents>;

  constructor() {
    this.messagePort = new BetterMessagePort(this.messageChannel.port1);
  }

  private initProcess() {
    if (this.runnerProcess) return;

    this.runnerProcess = utilityProcess.fork(workflowRunnerFilePath);

    this.runnerProcess.on('exit', () => {
      this.runnerProcess?.kill();
      this.runnerProcess?.removeAllListeners();
      this.messageChannel.port1.close();
      this.messageChannel.port2.close();
      this.messagePort.destroy();

      this.runnerProcess = null;
      this.messageChannel = new MessageChannelMain();
      this.messagePort = new BetterMessagePort(this.messageChannel.port1);
    });

    this.runnerProcess.postMessage('init', [this.messageChannel.port2]);
  }

  async run({ id: workflowId, ...payload }: WorkflowRunPayload) {
    this.initProcess();

    const workflow = await DBService.instance.workflow.get(workflowId);
    if (!workflow) throw new CustomError('Workflow not found');

    return this.messagePort.async.sendMessage('workflow:run', {
      workflow,
      ...payload,
    });
  }
}

export default WorkflowRunnerService;
