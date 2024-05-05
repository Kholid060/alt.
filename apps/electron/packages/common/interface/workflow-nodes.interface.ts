import type { SetRequired } from 'type-fest';
import type { WorkflowNodeErroHandlerAction } from './workflow.interface';
import type { ExtensionCommandArgument } from '@repo/extension-core';
import type { WORKFLOW_NODE_TYPE } from '../utils/constant/constant';
import type { Node } from 'reactflow';

export type WorkflowNodeHandleSource = 'default' | 'error-fallback';

export type WorkflowNodeHandleTarget = 'default';

export interface WorkflowNodeErrorHandler {
  retry: boolean;
  retryCount: number;
  retryIntervalMs: number;
  action: WorkflowNodeErroHandlerAction;
}

export interface WorkflowNodeExpressionData {
  value: string;
  active: boolean;
}
export type WorkflowNodeExpressionRecords = Record<
  string,
  WorkflowNodeExpressionData
>;

export interface WorkflowNodeBaseData {
  isDisabled: boolean;
  description?: string;
  $expData?: WorkflowNodeExpressionRecords;
  $errorHandler?: WorkflowNodeErrorHandler;
}

export type WorkflowNodeBase<
  T = unknown,
  P extends string = string,
> = SetRequired<Node<T & WorkflowNodeBaseData, P>, 'type'>;

export type WorkflowNodeCommand = WorkflowNodeBase<
  {
    icon: string;
    title: string;
    commandId: string;
    extension: {
      id: string;
      title: string;
      version: string;
    };
    args: ExtensionCommandArgument[];
    argsValue: Record<string, unknown>;
  },
  WORKFLOW_NODE_TYPE.COMMAND
>;

export type WorkflowNodeLoop = WorkflowNodeBase<
  {
    varName: string;
    expression: string;
    dataSource: 'prev-node' | 'variable' | 'expression';
  },
  WORKFLOW_NODE_TYPE.LOOP
>;

export type WorkflowNodeCode = WorkflowNodeBase<
  {
    jsCode: string;
  },
  WORKFLOW_NODE_TYPE.CODE
>;

export type WorkflowNodeDoNothing = WorkflowNodeBase<
  object,
  WORKFLOW_NODE_TYPE.DO_NOTHING
>;

export interface WorkflowNodeTriggerManual {
  type: 'manual';
}

export type WorkflowNodeTrigger = WorkflowNodeBase<
  WorkflowNodeTriggerManual,
  WORKFLOW_NODE_TYPE.TRIGGER
>;

export interface WorkflowNodesMap {
  [WORKFLOW_NODE_TYPE.LOOP]: WorkflowNodeLoop;
  [WORKFLOW_NODE_TYPE.CODE]: WorkflowNodeCode;
  [WORKFLOW_NODE_TYPE.COMMAND]: WorkflowNodeCommand;
  [WORKFLOW_NODE_TYPE.TRIGGER]: WorkflowNodeTrigger;
  [WORKFLOW_NODE_TYPE.DO_NOTHING]: WorkflowNodeDoNothing;
}

export type WorkflowNodes = WorkflowNodesMap[keyof WorkflowNodesMap];
