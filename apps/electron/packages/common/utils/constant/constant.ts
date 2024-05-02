export const APP_TEMP_DIR_NAME = {} as const;

export const APP_ICON_DIR_PREFIX = '$app';

export const CUSTOM_SCHEME = {
  sandbox: 'sandbox',
  fileIcon: 'file-icon',
  extension: 'extension',
} as const;

export const EXTENSION_VIEW = {
  path: '/extension',
  idQuery: 'extension-id',
  frameName: 'extension-sandbox',
};

export const PRELOAD_API_KEY = {
  main: '__mainAPI',
  extension: '_extension',
} as const;

export const IPC_ON_EVENT = {
  rendererInvoke: 'renderer-invoke',
  deleteMessagePortMain: 'delete-message-port',
  createMessagePortMain: 'create-message-port',
} as const;

export const IPC_POST_MESSAGE_EVENT = {
  extensionPortCreated: 'extension-port-created',
} as const;

export enum WORKFLOW_NODE_TYPE {
  COMMAND = 'node-command',
  TRIGGER = 'node-trigger',
}

export const DATABASE_CHANGES_ALL_ARGS = '$database-all-args$' as const;

export const APP_DEEP_LINK = 'app-app';

export const APP_WORKFLOW_ELS_FORMAT = 'APP_NAME/workflow-elements' as const;

export const WORKFLOW_MANUAL_TRIGGER_ID = '$manual$' as const;

export const MESSAGE_PORT_CHANNEL_IDS = {
  sharedWithCommand: 'shared-with-command',
} as const;
