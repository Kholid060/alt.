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

export const DATABASE_CHANGES_ALL_ARGS = '$database-all-args$' as const;

export const MESSAGE_PORT_CHANNEL_IDS = {
  sharedWithCommand: 'shared-with-command',
} as const;

export const OAUTH_SERVER_PORT = 4568;
export const OAUTH_CALLBACK_URL = `http://localhost:${OAUTH_SERVER_PORT}/oauth/callback`;
