export enum WORKFLOW_NODE_TYPE {
  NOTE = 'node-note',
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
  BROWSER_SELECT = 'node-browser-select',
  BROWSER_KEYBOARD = 'node-browser-keyboard',
  EXECUTE_WORKFLOW = 'node-execute-workflow',
  TRIGGER_SHORTCUT = 'node-trigger-shortcut',
  GET_ELEMENT_TEXT = 'node-get-element-text',
  ELEMENT_ATTRIBUTES = 'node-element-attributes',
  TRIGGER_EXECUTE_WORKFLOW = 'node-trigger-execute-workflow',
}
