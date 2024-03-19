import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import Store from 'electron-store';

export interface ElectronStore {
  installedApps: {
    fetchedAt: string | null;
    appsTarget: Record<string, string>;
    list: ExtensionAPI.shell.installedApps.AppDetail[];
  };
  localExtensions: Record<
    string,
    {
      id: string;
      path: string;
    }
  >;
  bypassCommands: string[];
}

export const store = new Store<ElectronStore>({
  encryptionKey: Buffer.from(import.meta.env.VITE_STORE_KEY),
  schema: {
    localExtensions: {
      type: 'object',
      patternProperties: {
        '.*': {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            path: {
              type: 'string',
            },
          },
          required: ['path', 'id'],
          additionalProperties: false,
        },
      },
    },
    bypassCommands: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
    },
    installedApps: {
      type: 'object',
      properties: {
        fetchedAt: {
          type: ['string', 'null'],
          format: 'date-time',
        },
        list: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              icon: { type: 'string' },
              name: { type: 'string' },
              appId: { type: 'string' },
              description: { type: 'string' },
            },
            required: ['name', 'appId'],
          },
        },
        appsTarget: {
          type: 'object',
          patternProperties: {
            '.*': {
              minLength: 1,
              type: 'string',
            },
          },
        },
      },
      additionalProperties: false,
      required: ['fetchedAt', 'list', 'appsTarget'],
      default: {
        list: [],
        appsTarget: {},
        fetchedAt: null,
      },
    },
  },
});
