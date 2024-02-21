import Store from 'electron-store';
import type { PublicInstalledAppDetail } from '#common/interface/installed-apps';

export interface ElectronStore {
  installedApps: {
    fetchedAt: string | null;
    list: PublicInstalledAppDetail[];
    appsTarget: Record<string, string>;
  }
}

export const store = new Store<ElectronStore>({
  schema: {
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
