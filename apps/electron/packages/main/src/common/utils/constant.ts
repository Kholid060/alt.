import path from 'path';
import { app } from 'electron';
import { fileURLToPath } from 'url';

export const EXTENSION_FOLDER = path.join(
  app.getPath('userData'),
  'extensions',
);

export const DATABASE_FOLDER = path.join(app.getPath('userData'), 'Database');

export const EXTENSION_LOCAL_ID_PREFIX = 'local__';

export const GLOBAL_SHORTCUTS = {
  toggleCommandWindow: 'Alt+.',
  closeCommandWindow: 'Escape',
} as const;

export const __FILENAME = fileURLToPath(import.meta.url);

export const __DIRNAME = path.dirname(__FILENAME);
