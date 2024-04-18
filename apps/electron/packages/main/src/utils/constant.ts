import path from 'path';
import { app } from 'electron';

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
