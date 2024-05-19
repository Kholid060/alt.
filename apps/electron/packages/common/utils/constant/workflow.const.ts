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
  USE_BROWSER = 'node-use-browser',
  FILE_SYSTEM = 'node-file-system',
  HTTP_REQUEST = 'node-http-request',
  NOTIFICATION = 'node-notification',
  TRIGGER_SHORTCUT = 'node-trigger-shortcut',
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
