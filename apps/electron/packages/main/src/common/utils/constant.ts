import path from 'path';
import { app } from 'electron';
import { fileURLToPath } from 'url';

const userDataPath = app.getPath('userData');

export const EXTENSION_FOLDER = path.join(userDataPath, 'extensions');

export const APP_LOGS_DIR = path.join(userDataPath, 'logs');

export const WORKFLOW_LOGS_FOLDER = path.join(APP_LOGS_DIR, 'workflows');
export const DATABASE_FOLDER = path.join(userDataPath, 'Database');

export const EXTENSION_LOCAL_ID_PREFIX = 'local__';

export const GLOBAL_SHORTCUTS = {
  toggleCommandWindow: 'Alt+.',
  closeCommandWindow: 'Escape',
} as const;

export const __FILENAME = fileURLToPath(import.meta.url);

export const __DIRNAME = path.dirname(__FILENAME);
