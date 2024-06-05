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
  HTTP_REQUEST = 'node-http-request',
  NOTIFICATION = 'node-notification',
  BROWSER_MOUSE = 'node-browser-mouse',
  BROWSER_KEYBOARD = 'node-browser-keyboard',
  EXECUTE_WORKFLOW = 'node-execute-workflow',
  TRIGGER_SHORTCUT = 'node-trigger-shortcut',
  GET_ELEMENT_TEXT = 'node-get-element-text',
  TRIGGER_EXECUTE_WORKFLOW = 'node-trigger-execute-workflow',
}

export const WORKFLOW_MANUAL_TRIGGER_ID = '$manual$' as const;

export const WORKFLOW_ELEMENT_FORMAT = 'APP_NAME/workflow-elements' as const;

export const WORKFLOW_NODE_GROUP = [
  'Flow',
  'Core',
  'Triggers',
  'Browser',
  'Commands',
  'Scripts',
] as const;

export enum WORKFLOW_HISTORY_STATUS {
  Error = 'error',
  Stop = 'stopped',
  Finish = 'finish',
  Running = 'running',
}
