/* eslint-disable drizzle/enforce-delete-with-where */
import {
  WorkflowEmitEvents,
  WorkflowRunPayload,
} from '#packages/common/interface/workflow.interface';
import { Injectable } from '@nestjs/common';
import { __DIRNAME, WORKFLOW_LOGS_FOLDER } from '../common/utils/constant';
import { WorkflowQueryService } from '../workflow/workflow-query.service';
import { ipcMain, utilityProcess } from 'electron';
import { BetterMessagePort } from '@altdot/shared';
import {
  WorkflowStatusErrorEvent,
  WorkflowRunnerMessagePort,
  WorkflowStatusFinishEvent,
} from './interfaces/workflow-runner.interface';
import { WorkflowHistoryService } from '../workflow/workflow-history/workflow-history.service';
import path from 'path';
import { nanoid } from 'nanoid';
import { WORKFLOW_HISTORY_STATUS } from '#packages/common/utils/constant/workflow.const';
import { BrowserWindowService } from '../browser-window/browser-window.service';

const WORKER_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class WorkflowRunnerService {
  private worker: {
    timeout: NodeJS.Timeout | null;
    process: Electron.UtilityProcess;
    messagePort: WorkflowRunnerMessagePort;
  } | null = null;
  private readonly runningWorkflows: Map<
    string,
    { runnerId: string; historyId: number; workflowId: string }
  > = new Map();

  constructor(
    private readonly browserWindow: BrowserWindowService,
    private readonly workflowQuery: WorkflowQueryService,
    private readonly workflowHistory: WorkflowHistoryService,
  ) {
    this.onWorkflowError = this.onWorkflowError.bind(this);
    this.onWorkflowFinish = this.onWorkflowFinish.bind(this);
  }

  private async ensureWorker() {
    if (this.worker) {
      if (this.worker.timeout) {
        clearTimeout(this.worker.timeout);
        this.worker.timeout = null;
      }

      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const process = utilityProcess.fork(
        path.join(__DIRNAME, './workflow-runner.worker.js'),
      );
      process.once('spawn', resolve);
      process.once('exit', () => {
        this.worker?.messagePort.destroy();
        this.worker = null;
      });

      const workerPort = {
        close() {
          process.removeAllListeners();
        },
        start() {},
        postMessage: (message) => process.postMessage(message),
        removeListener(_event, _listener) {},
        addListener(event, listener) {
          if (event !== 'message') return;

          process.addListener('message', (data) => {
            listener({ data, ports: [] });
          });
        },
      } as Electron.MessagePortMain;
      const messagePort: WorkflowRunnerMessagePort = new BetterMessagePort(
        workerPort,
      );

      messagePort.sync.on('workflow-event:node-execute-error', (...args) =>
        this.emitEventToDashboard({ 'node:execute-error': args }),
      );
      messagePort.sync.on('workflow-event:node-execute-finish', (...args) =>
        this.emitEventToDashboard({ 'node:execute-finish': args }),
      );
      messagePort.sync.on('workflow-event:error', this.onWorkflowError);
      messagePort.sync.on('workflow-event:finish', this.onWorkflowFinish);
      messagePort.async.on('ipc:invoke', (name, args) => {
        // @ts-expect-error _invokeHandlers is private property
        const handler = ipcMain._invokeHandlers.get(name);
        if (!handler) throw new Error(`"${name}" doesn't have handler`);

        return handler({}, ...args);
      });
      messagePort.sync.on('ipc:send', (name, args) => {
        // @ts-expect-error _events is private property
        const handler = ipcMain._events[name];
        if (!handler) throw new Error(`"${name}" doesn't have handler`);

        return handler({}, ...args);
      });

      this.worker = {
        process,
        messagePort,
        timeout: null,
      };
    });
  }

  private async emitEventToDashboard(events: Partial<WorkflowEmitEvents>) {
    const dashboardWindow = await this.browserWindow.get('dashboard', {
      autoCreate: false,
      noThrow: true,
    });
    if (!dashboardWindow) return;

    dashboardWindow.sendMessage(
      { name: 'workflow:execution-events', ensureWindow: false, noThrow: true },
      events,
    );
  }

  private startWorkerTimer() {
    if (!this.worker || this.worker.timeout) return;

    this.worker.timeout = setTimeout(() => {
      this.worker?.process.kill();
    }, WORKER_TIMEOUT_MS);
  }

  private onWorkflowError(
    runnerId: string,
    { message, startedAt, errorLocation }: WorkflowStatusErrorEvent,
  ) {
    const runner = this.runningWorkflows.get(runnerId);
    if (!runner) return;

    this.workflowHistory.updateHistory(runner.historyId, {
      startedAt,
      errorLocation,
      errorMessage: message,
      status: WORKFLOW_HISTORY_STATUS.Error,
    });
    this.runningWorkflows.delete(runnerId);

    if (this.runningWorkflows.size === 0) this.startWorkerTimer();
  }

  private onWorkflowFinish(
    runnerId: string,
    { startedAt }: WorkflowStatusFinishEvent,
  ) {
    const runner = this.runningWorkflows.get(runnerId);
    if (!runner) return;

    this.workflowHistory.updateHistory(runner.historyId, {
      startedAt,
      status: WORKFLOW_HISTORY_STATUS.Finish,
    });
    this.runningWorkflows.delete(runnerId);

    if (this.runningWorkflows.size === 0) this.startWorkerTimer();
  }

  async execute(payload: WorkflowRunPayload) {
    const workflow = await this.workflowQuery.get(payload.id);
    if (!workflow) throw new Error("Couldn't find workflow");
    if (workflow.isDisabled) return null;

    await this.workflowQuery.incrementExecuteCount(payload.id);

    if (payload.customElement) {
      workflow.nodes = payload.customElement.nodes;
      workflow.edges = payload.customElement.edges;
    }

    await this.ensureWorker();

    const runnerId = nanoid(5);
    const [history] = await this.workflowHistory.insertHistory({
      runnerId,
      workflowId: workflow.id,
      startedAt: new Date().toString(),
      status: WORKFLOW_HISTORY_STATUS.Running,
    });
    const result = await this.worker!.messagePort.async.sendMessage(
      'execute-workflow',
      {
        ...payload,
        workflow,
        runnerId,
        logDir: WORKFLOW_LOGS_FOLDER,
      },
    );
    this.runningWorkflows.set(result.runnerId, {
      runnerId,
      historyId: history.id,
      workflowId: workflow.id,
    });

    return runnerId;
  }

  async stopExecution(runnerId: string) {
    if (!this.worker) {
      const history = await this.workflowHistory.get({ runnerId });
      if (!history) return;

      const endedAt = new Date();
      await this.workflowHistory.updateHistory(
        {
          runnerId,
        },
        {
          endedAt: endedAt.toISOString(),
          status: WORKFLOW_HISTORY_STATUS.Finish,
          duration: endedAt.getTime() - new Date(history.startedAt).getTime(),
        },
      );
      return;
    }

    this.worker.messagePort.sync.sendMessage('worker:stop-execution', runnerId);
  }
}
