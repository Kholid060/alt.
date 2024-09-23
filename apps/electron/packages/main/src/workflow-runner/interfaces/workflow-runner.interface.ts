import { WorkflowRunnerRunPayload } from '#packages/common/interface/workflow-runner.interace';
import { BetterMessagePort } from '@altdot/shared';
import { WorkflowRunnerFinishReason } from '../const/workflow-runner.const';
import { WORKFLOW_NODE_TYPE, WorkflowNodes } from '@altdot/workflow';
import {
  IPCEvents,
  IPCSendEventRendererToMain,
} from '#packages/common/interface/ipc-events.interface';

interface WorkflowRunnerEvents {
  'workflow-event:node-execute-finish': [
    runnerId: string,
    node: { id: string; type: WORKFLOW_NODE_TYPE; name: string },
    value: unknown,
  ];
  'workflow-event:node-execute-error': [
    runnerId: string,
    node: { id: string; type: WORKFLOW_NODE_TYPE; name: string },
    message: string,
  ];
  'workflow-event:error': [runnerId: string, error: WorkflowStatusErrorEvent];
  'workflow-event:finish': [runnerId: string, event: WorkflowStatusFinishEvent];
}

export interface WorkflowRunnerMessageSyncEvents extends WorkflowRunnerEvents {
  'worker:stop-execution': [runnerId: string];
  'ipc:send'<T extends keyof IPCSendEventRendererToMain>(
    name: T,
    args: IPCSendEventRendererToMain[T],
  ): void;
}

export interface WorkflowStatusFinishEvent {
  startedAt: string;
  reason: WorkflowRunnerFinishReason;
}
export interface WorkflowStatusErrorEvent {
  message: string;
  startedAt: string;
  node?: WorkflowNodes;
  errorLocation?: string;
}

export interface WorkflowRunnerMessageAsyncEvents {
  'execute-workflow'(payload: WorkflowRunnerRunPayload): { runnerId: string };
  'ipc:invoke'<T extends keyof IPCEvents>(
    name: T,
    args: Parameters<IPCEvents[T]>,
  ): ReturnType<IPCEvents[T]>;
}

export type WorkflowRunnerMessagePort = BetterMessagePort<
  WorkflowRunnerMessageAsyncEvents,
  WorkflowRunnerMessageSyncEvents
>;
