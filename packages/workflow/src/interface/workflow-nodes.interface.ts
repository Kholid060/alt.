import type { ExtensionAPI } from '@altdot/extension';
import type { WORKFLOW_NODE_TYPE } from '../const/workflow-nodes-type.const';
import type {
  KeyboardShortcut,
  BrowserType,
  BrowserSelectFileOptions,
} from '@altdot/shared';
import type { Edge, Node } from '@xyflow/react';
import { ExtensionCommandArgument } from '@altdot/extension/dist/extension-manifest';

export type WorkflowEdges = Edge;

export type WorkflowNodeErroHandlerAction = 'continue' | 'stop' | 'fallback';

export type WorkflowNodeHandleSource = 'default' | 'error-fallback';

export type WorkflowNodeHandleTarget = 'default';

export type WorkflowVariableMode = 'replace' | 'append';

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

export type WorkflowNodeBaseData<T extends WORKFLOW_NODE_TYPE> = {
  $nodeType: T;
  isDisabled: boolean;
  description?: string;
  $outputVarName?: string;
  $outputVarMode?: WorkflowVariableMode;
  $expData?: WorkflowNodeExpressionRecords;
  $errorHandler?: WorkflowNodeErrorHandler;
};

export type WorkflowNodeBase<
  T extends Record<string, unknown> = Record<string, unknown>,
  P extends WORKFLOW_NODE_TYPE = WORKFLOW_NODE_TYPE,
> = Node<T & WorkflowNodeBaseData<P>, P> & { type: P };

export type WorkflowNodeCommand = WorkflowNodeBase<
  {
    icon: string;
    title: string;
    commandId: string;
    extension: {
      id: string;
      title: string;
      version: string;
      isLocal: boolean;
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
    fileData: string;
    appendFile: boolean;
    readFilePath: string;
    writeFilePath: string;
    throwIfEmpty: boolean;
    action: 'read' | 'write' | 'stat';
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
  Record<string, unknown>,
  WORKFLOW_NODE_TYPE.DO_NOTHING
>;

export type WorkflowNodeDelay = WorkflowNodeBase<
  { delayMs: number },
  WORKFLOW_NODE_TYPE.DELAY
>;

export type WorkflowNodeClipboard = WorkflowNodeBase<
  {
    newClipboardVal: string;
    action: 'read' | 'write' | 'paste';
    format: ExtensionAPI.Clipboard.ClipboardContentType;
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
    rawBody: {
      data: string;
      contentType: string;
    };
  },
  WORKFLOW_NODE_TYPE.HTTP_REQUEST
>;

export type WorkflowNodeTrigger = WorkflowNodeBase<
  Record<string, unknown>,
  WORKFLOW_NODE_TYPE.TRIGGER
>;
export type WorkflowNodeTriggerShortcut = WorkflowNodeBase<
  { shortcut: KeyboardShortcut | null },
  WORKFLOW_NODE_TYPE.TRIGGER_SHORTCUT
>;

export type WorkflowNodeNotification = WorkflowNodeBase<
  Required<ExtensionAPI.Notifications.NotificationOptions>,
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
    exposeVars: string;
    workflowId: string;
    variables: Record<string, unknown>;
  },
  WORKFLOW_NODE_TYPE.EXECUTE_WORKFLOW
>;

export interface WorkflowNodeInsertDataItem {
  id: string;
  name: string;
  value: string;
  mode: WorkflowVariableMode;
}
export type WorkflowNodeInsertData = WorkflowNodeBase<
  {
    items: WorkflowNodeInsertDataItem[];
  },
  WORKFLOW_NODE_TYPE.INSERT_DATA
>;

export type WorkflowNodeTriggerExecuteWorkflow = WorkflowNodeBase<
  Record<string, unknown>,
  WORKFLOW_NODE_TYPE.TRIGGER_EXECUTE_WORKFLOW
>;

export type WorkflowNodeBrowserTab = WorkflowNodeBase<
  {
    newTabURL: string;
    findTabFiler: string;
    action: 'open-tab' | 'find-tab' | 'use-active-tab';
  },
  WORKFLOW_NODE_TYPE.BROWSER_TAB
>;

export type WorkflowNodeBrowserMouse = WorkflowNodeBase<
  {
    selector: string;
    action: 'mouse-down' | 'mouse-up' | 'click';
  },
  WORKFLOW_NODE_TYPE.BROWSER_MOUSE
>;

export type WorkflowNodeBrowserKeyboard = WorkflowNodeBase<
  {
    text: string;
    delay: number;
    selector: string;
    clearFormValue: boolean;
    key: ExtensionAPI.Browser.Tabs.KeyboardKeys;
    action: 'key-down' | 'press' | 'key-up' | 'type';
    modifiers: ExtensionAPI.Browser.Tabs.KeyboardModifiers[];
  },
  WORKFLOW_NODE_TYPE.BROWSER_KEYBOARD
>;

export type WorkflowNodeGetElementText = WorkflowNodeBase<
  {
    selector: string;
    outerHTML: boolean;
    visibleTextOnly: boolean;
    action: 'get-text' | 'get-html';
  },
  WORKFLOW_NODE_TYPE.GET_ELEMENT_TEXT
>;

export type WorkflowNodeElementAttributes = WorkflowNodeBase<
  {
    selector: string;
    getAttrs: string;
    setAttrsJSON: string;
    action: 'set' | 'get';
    useSetAttrsJSON: boolean;
    $setAttrsExp: WorkflowNodeExpressionRecords;
    setAttrs: { name: string; value: string }[];
  },
  WORKFLOW_NODE_TYPE.ELEMENT_ATTRIBUTES
>;

export type WorkflowNodeWaitSelector = WorkflowNodeBase<
  {
    selector: string;
  } & Required<ExtensionAPI.Browser.Tabs.WaitForSelectorOptions>,
  WORKFLOW_NODE_TYPE.WAIT_SELECTOR
>;

export type WorkflowNodeBrowserSelect = WorkflowNodeBase<
  {
    selector: string;
    values: string[];
    jsonInput: string;
    mode: 'list' | 'json';
  },
  WORKFLOW_NODE_TYPE.BROWSER_SELECT
>;

export type WorkflowNodeSelectFile = WorkflowNodeBase<
  {
    files: string[];
    selector: string;
    jsonInput: string;
    mode: 'list' | 'json';
    action: BrowserSelectFileOptions['action'];
  },
  WORKFLOW_NODE_TYPE.SELECT_FILE
>;

export type WorkflowNodeNote = WorkflowNodeBase<
  {
    color: string;
    content: string;
  },
  WORKFLOW_NODE_TYPE.NOTE
>;

export interface WorkflowNodesMap {
  [WORKFLOW_NODE_TYPE.NOTE]: WorkflowNodeNote;
  [WORKFLOW_NODE_TYPE.LOOP]: WorkflowNodeLoop;
  [WORKFLOW_NODE_TYPE.CODE]: WorkflowNodeCode;
  [WORKFLOW_NODE_TYPE.DELAY]: WorkflowNodeDelay;
  [WORKFLOW_NODE_TYPE.COMMAND]: WorkflowNodeCommand;
  [WORKFLOW_NODE_TYPE.TRIGGER]: WorkflowNodeTrigger;
  [WORKFLOW_NODE_TYPE.CLIPBOARD]: WorkflowNodeClipboard;
  [WORKFLOW_NODE_TYPE.DO_NOTHING]: WorkflowNodeDoNothing;
  [WORKFLOW_NODE_TYPE.BREAK_LOOP]: WorkflowNodeBreakLoop;
  [WORKFLOW_NODE_TYPE.SELECT_FILE]: WorkflowNodeSelectFile;
  [WORKFLOW_NODE_TYPE.BROWSER_TAB]: WorkflowNodeBrowserTab;
  [WORKFLOW_NODE_TYPE.INSERT_DATA]: WorkflowNodeInsertData;
  [WORKFLOW_NODE_TYPE.USE_BROWSER]: WorkflowNodeUseBrowser;
  [WORKFLOW_NODE_TYPE.FILE_SYSTEM]: WorkflowNodeFileSystem;
  [WORKFLOW_NODE_TYPE.CONDITIONAL]: WorkflowNodeConditional;
  [WORKFLOW_NODE_TYPE.HTTP_REQUEST]: WorkflowNodeHttpRequest;
  [WORKFLOW_NODE_TYPE.NOTIFICATION]: WorkflowNodeNotification;
  [WORKFLOW_NODE_TYPE.BROWSER_MOUSE]: WorkflowNodeBrowserMouse;
  [WORKFLOW_NODE_TYPE.WAIT_SELECTOR]: WorkflowNodeWaitSelector;
  [WORKFLOW_NODE_TYPE.BROWSER_SELECT]: WorkflowNodeBrowserSelect;
  [WORKFLOW_NODE_TYPE.GET_ELEMENT_TEXT]: WorkflowNodeGetElementText;
  [WORKFLOW_NODE_TYPE.BROWSER_KEYBOARD]: WorkflowNodeBrowserKeyboard;
  [WORKFLOW_NODE_TYPE.EXECUTE_WORKFLOW]: WorkflowNodeExecuteWorkflow;
  [WORKFLOW_NODE_TYPE.TRIGGER_SHORTCUT]: WorkflowNodeTriggerShortcut;
  [WORKFLOW_NODE_TYPE.ELEMENT_ATTRIBUTES]: WorkflowNodeElementAttributes;
  [WORKFLOW_NODE_TYPE.TRIGGER_EXECUTE_WORKFLOW]: WorkflowNodeTriggerExecuteWorkflow;
}

export type WorkflowNodes =
  | WorkflowNodeNote
  | WorkflowNodeLoop
  | WorkflowNodeCode
  | WorkflowNodeDelay
  | WorkflowNodeCommand
  | WorkflowNodeTrigger
  | WorkflowNodeClipboard
  | WorkflowNodeDoNothing
  | WorkflowNodeBreakLoop
  | WorkflowNodeSelectFile
  | WorkflowNodeBrowserTab
  | WorkflowNodeInsertData
  | WorkflowNodeUseBrowser
  | WorkflowNodeFileSystem
  | WorkflowNodeConditional
  | WorkflowNodeHttpRequest
  | WorkflowNodeNotification
  | WorkflowNodeBrowserMouse
  | WorkflowNodeWaitSelector
  | WorkflowNodeBrowserSelect
  | WorkflowNodeGetElementText
  | WorkflowNodeBrowserKeyboard
  | WorkflowNodeExecuteWorkflow
  | WorkflowNodeTriggerShortcut
  | WorkflowNodeElementAttributes
  | WorkflowNodeTriggerExecuteWorkflow;
