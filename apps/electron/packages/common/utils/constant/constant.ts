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
