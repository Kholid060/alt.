export const APP_TEMP_DIR_NAME = {
  appIcon: 'app-icon',
} as const;

export const CUSTOM_SCHEME = {
  appIcon: 'app-icon',
  extIcon: 'ext-icon',
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
  deleteExtensionPort: 'delete-extension-port',
  createExtensionPort: 'create-extension-port',
} as const;

export const IPC_POST_MESSAGE_EVENT = {
  extensionPortCreated: 'extension-port-created',
} as const;

export const APP_DEEP_LINK = 'app-app';
