import Store from 'electron-store';

export interface ElectronStore {
  bypassCommands: string[];
  windowBounds: Record<string, Electron.Rectangle>;
}

export const store = new Store<ElectronStore>({
  encryptionKey: Buffer.from(
    import.meta.env.VITE_STORE_KEY || 'some-random-string',
  ),
  schema: {
    bypassCommands: {
      type: 'array',
      items: { type: 'string' },
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
