export enum WORKFLOW_NODE_TYPE {
  LOOP = 'node-loop',
  CODE = 'node-code',
  DELAY = 'node-delay',
  COMMAND = 'node-command',
  TRIGGER = 'node-trigger',
  CLIPBOARD = 'node-clipboard',
  DO_NOTHING = 'node-do-nothing',
  BREAK_LOOP = 'node-break-loop',
  CONDITIONAL = 'node-conditional',
  INSERT_DATA = 'node-insert-data',
  USE_BROWSER = 'node-use-browser',
  FILE_SYSTEM = 'node-file-system',
  BROWSER_TAB = 'node-browser-tab',
  SELECT_FILE = 'node-select-file',
  HTTP_REQUEST = 'node-http-request',
  NOTIFICATION = 'node-notification',
  BROWSER_MOUSE = 'node-browser-mouse',
  WAIT_SELECTOR = 'node-wait-selector',
  BROWSER_KEYBOARD = 'node-browser-keyboard',
  EXECUTE_WORKFLOW = 'node-execute-workflow',
  TRIGGER_SHORTCUT = 'node-trigger-shortcut',
  GET_ELEMENT_TEXT = 'node-get-element-text',
  ELEMENT_ATTRIBUTES = 'node-element-attributes',
  TRIGGER_EXECUTE_WORKFLOW = 'node-trigger-execute-workflow',
}

export const WORKFLOW_MANUAL_TRIGGER_ID = '$manual$' as const;

export const WORKFLOW_ELEMENT_FORMAT = 'alt-dot/workflow-elements' as const;

export const WORKFLOW_NODE_GROUP = [
  'Flow',
  'Core',
  'Triggers',
  'Browser',
  'Commands',
  'Scripts',
] as const;

export const WORKFLOW_NODE_TRIGGERS: string[] = [
  WORKFLOW_NODE_TYPE.TRIGGER,
  WORKFLOW_NODE_TYPE.TRIGGER_SHORTCUT,
  WORKFLOW_NODE_TYPE.TRIGGER_EXECUTE_WORKFLOW,
] as const;

export enum WORKFLOW_HISTORY_STATUS {
  Error = 'error',
  Stop = 'stopped',
  Finish = 'finish',
  Running = 'running',
}
