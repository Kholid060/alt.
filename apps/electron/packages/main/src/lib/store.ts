import type { AppSettings } from '#packages/common/interface/app.interface';
import Store from 'electron-store';

export interface ElectronStore {
  settings: AppSettings | null;
  windowBounds: Record<string, Electron.Rectangle>;
}

Store.initRenderer();

export const store = new Store<ElectronStore>({
  encryptionKey: Buffer.from(
    import.meta.env.VITE_SECRET_DATA_KEY || 'some-random-string',
  ),
  schema: {
    settings: {
      type: ['object', 'null'],
      default: null,
      properties: {
        startup: { type: 'boolean', default: false },
        clearStateAfter: { type: 'number', default: 10 },
        upsertRestoreDuplicate: { type: 'boolean', default: true },
      },
      required: ['startup', 'clearStateAfter', 'upsertRestoreDuplicate'],
    },
    windowBounds: {
      type: 'object',
      patternProperties: {
        '.*': {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
            width: { type: 'number' },
            height: { type: 'number' },
          },
          required: ['x', 'y', 'height', 'width'],
        },
      },
    },
  },
});
