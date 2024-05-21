import type { SetRequired } from 'type-fest';
import type { WorkflowNodeErroHandlerAction } from './workflow.interface';
import type { ExtensionCommandArgument } from '@repo/extension-core';
import type { WORKFLOW_NODE_TYPE } from '../utils/constant/workflow.const';
import type { Node } from 'reactflow';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import type { KeyboardShortcut, BrowserType } from '@repo/shared';

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

export interface WorkflowNodeBaseData<T extends WORKFLOW_NODE_TYPE> {
  $nodeType: T;
  isDisabled: boolean;
  description?: string;
  $expData?: WorkflowNodeExpressionRecords;
  $errorHandler?: WorkflowNodeErrorHandler;
}

export type WorkflowNodeBase<
  T = unknown,
  P extends WORKFLOW_NODE_TYPE = WORKFLOW_NODE_TYPE,
> = SetRequired<Node<T & WorkflowNodeBaseData<P>, P>, 'type'>;

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

export type WorkflowNodeFileSystem = WorkflowNodeBase<
  {
    varName: string;
    fileData: string;
    appendFile: boolean;
    readFilePath: string;
    insertToVar: boolean;
    writeFilePath: string;
    throwIfEmpty: boolean;
    action: 'read' | 'write';
  },
  WORKFLOW_NODE_TYPE.FILE_SYSTEM
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

export type WorkflowNodeDelay = WorkflowNodeBase<
  { delayMs: number },
  WORKFLOW_NODE_TYPE.DELAY
>;

export type WorkflowNodeClipboard = WorkflowNodeBase<
  {
    varName: string;
    insertToVar: boolean;
    newClipboardVal: string;
    action: 'read' | 'write' | 'paste';
    format: ExtensionAPI.clipboard.ClipboardContentType;
  },
  WORKFLOW_NODE_TYPE.CLIPBOARD
>;
export type WorkflowNodeConditionItemOperator =
  | 'str:equal'
  | 'any:is-nullish'
  | 'str:ends-with'
  | 'str:starts-with'
  | 'str:match-regex'
  | 'str:contains'
  | 'int:equal'
  | 'int:greater'
  | 'int:greater-equal'
  | 'int:less'
  | 'int:less-equal'
  | 'bool:equal'
  | 'bool:is-true'
  | 'bool:is-false'
  | 'array:contains'
  | 'array:len-less'
  | 'array:len-equal'
  | 'array:len-greater'
  | 'array:len-less-equal'
  | 'array:len-greater-equal'
  | 'array:contains'
  | 'obj:is-empty'
  | 'obj:has-property';

export interface WorkflowNodeConditionItem {
  id: string;
  value1: string;
  value2: unknown;
  type: 'and' | 'or';
  reverseValue: boolean; // equals => !equals;
  operator: WorkflowNodeConditionItemOperator;
  $expData?: {
    value1?: WorkflowNodeExpressionData;
    value2?: WorkflowNodeExpressionData;
  };
}
export type WorkflowNodeConditionItems = WorkflowNodeConditionItem[][];

export interface WorkflowNodeConditionPath {
  id: string;
  name: string;
  items: WorkflowNodeConditionItems;
}
export type WorkflowNodeConditional = WorkflowNodeBase<
  {
    conditions: WorkflowNodeConditionPath[];
  },
  WORKFLOW_NODE_TYPE.CONDITIONAL
>;
export type WorkflowNodeHttpRequest = WorkflowNodeBase<
  {
    url: string;
    jsonBody: string;
    timeoutMs: number;
    bodyType: 'json' | 'form-data' | 'form-urlencoded' | 'raw' | 'none';
    method: 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';
    queries: { name: string; value: string }[];
    headers: { name: string; value: string }[];
    formDataBody: { name: string; value: string }[];
    urlEncodedBody: { name: string; value: string }[];
    $bodyExpData?: WorkflowNodeExpressionRecords;
    response: {
      varName: string;
      insertToVar: boolean;
    };
    rawBody: {
      data: string;
      contentType: string;
    };
  },
  WORKFLOW_NODE_TYPE.HTTP_REQUEST
>;

export type WorkflowNodeTrigger = WorkflowNodeBase<
  object,
  WORKFLOW_NODE_TYPE.TRIGGER
>;
export type WorkflowNodeTriggerShortcut = WorkflowNodeBase<
  { shortcut: KeyboardShortcut | null },
  WORKFLOW_NODE_TYPE.TRIGGER_SHORTCUT
>;

export type WorkflowNodeNotification = WorkflowNodeBase<
  Required<ExtensionAPI.notifications.NotificationOptions>,
  WORKFLOW_NODE_TYPE.NOTIFICATION
>;

export type WorkflowNodeBreakLoop = WorkflowNodeBase<
  { loopNodeId: string },
  WORKFLOW_NODE_TYPE.BREAK_LOOP
>;

export type WorkflowNodeUseBrowser = WorkflowNodeBase<
  {
    useOpenedBrowser: boolean;
    preferBrowser: 'any' | BrowserType;
  },
  WORKFLOW_NODE_TYPE.USE_BROWSER
>;

export type WorkflowNodeExecuteWorkflow = WorkflowNodeBase<
  {
    varName: string;
    exposeVars: string;
    workflowId: string;
    insertToVar: boolean;
    variables: Record<string, unknown>;
  },
  WORKFLOW_NODE_TYPE.EXECUTE_WORKFLOW
>;

export interface WorkflowNodeInsertDataItem {
  id: string;
  name: string;
  value: string;
  mode: 'replace' | 'append';
}
export type WorkflowNodeInsertData = WorkflowNodeBase<
  {
    items: WorkflowNodeInsertDataItem[];
  },
  WORKFLOW_NODE_TYPE.INSERT_DATA
>;

export type WorkflowNodeTriggerExecuteWorkflow = WorkflowNodeBase<
  object,
  WORKFLOW_NODE_TYPE.TRIGGER_EXECUTE_WORKFLOW
>;

export type WorkflowNodeBrowserTab = WorkflowNodeBase<
  {
    newTabURL: string;
    action: 'open-tab' | 'use-active-tab';
  },
  WORKFLOW_NODE_TYPE.BROWSER_TAB
>;

export interface WorkflowNodesMap {
  [WORKFLOW_NODE_TYPE.LOOP]: WorkflowNodeLoop;
  [WORKFLOW_NODE_TYPE.CODE]: WorkflowNodeCode;
  [WORKFLOW_NODE_TYPE.DELAY]: WorkflowNodeDelay;
  [WORKFLOW_NODE_TYPE.COMMAND]: WorkflowNodeCommand;
  [WORKFLOW_NODE_TYPE.TRIGGER]: WorkflowNodeTrigger;
  [WORKFLOW_NODE_TYPE.CLIPBOARD]: WorkflowNodeClipboard;
  [WORKFLOW_NODE_TYPE.DO_NOTHING]: WorkflowNodeDoNothing;
  [WORKFLOW_NODE_TYPE.BREAK_LOOP]: WorkflowNodeBreakLoop;
  [WORKFLOW_NODE_TYPE.BROWSER_TAB]: WorkflowNodeBrowserTab;
  [WORKFLOW_NODE_TYPE.INSERT_DATA]: WorkflowNodeInsertData;
  [WORKFLOW_NODE_TYPE.USE_BROWSER]: WorkflowNodeUseBrowser;
  [WORKFLOW_NODE_TYPE.FILE_SYSTEM]: WorkflowNodeFileSystem;
  [WORKFLOW_NODE_TYPE.CONDITIONAL]: WorkflowNodeConditional;
  [WORKFLOW_NODE_TYPE.HTTP_REQUEST]: WorkflowNodeHttpRequest;
  [WORKFLOW_NODE_TYPE.NOTIFICATION]: WorkflowNodeNotification;
  [WORKFLOW_NODE_TYPE.EXECUTE_WORKFLOW]: WorkflowNodeExecuteWorkflow;
  [WORKFLOW_NODE_TYPE.TRIGGER_SHORTCUT]: WorkflowNodeTriggerShortcut;
  [WORKFLOW_NODE_TYPE.TRIGGER_EXECUTE_WORKFLOW]: WorkflowNodeTriggerExecuteWorkflow;
}

export type WorkflowNodes = WorkflowNodesMap[keyof WorkflowNodesMap];
