import Store from 'electron-store';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { AppSettings } from '#packages/common/interface/app.interface';

export interface ElectronStore {
  settings: AppSettings | null;
  lastCheckExtensionUpdate: string | null;
  windowBounds: Record<string, Electron.Rectangle>;
}

@Injectable()
export class StoreService implements OnModuleInit {
  store!: Store<ElectronStore>;

  onModuleInit() {
    this.store = new Store<ElectronStore>({
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
        lastCheckExtensionUpdate: {
          default: null,
          type: ['string', 'null'],
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
  }
}
