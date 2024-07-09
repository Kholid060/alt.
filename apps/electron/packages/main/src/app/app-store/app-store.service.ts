import Store from 'electron-store';
import { Injectable } from '@nestjs/common';
import { AppSettings } from '#packages/common/interface/app.interface';
import { app } from 'electron';
import { APP_DEFAULT_SETTINGS } from '/@/common/config/app.config';

export interface AppStoreData {
  settings: AppSettings | null;
  lastCheckExtensionUpdate: string | null;
}

@Injectable()
export class AppStoreService extends Store<AppStoreData> {
  constructor() {
    super({
      defaults: {
        lastCheckExtensionUpdate: null,
        settings: APP_DEFAULT_SETTINGS,
      },
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
      },
    });
  }

  getSettings<T extends keyof AppSettings>(key?: T): AppSettings;
  getSettings<T extends keyof AppSettings>(key: T): AppSettings[T];
  getSettings<T extends keyof AppSettings>(key?: T) {
    if (key) {
      if (key === 'startup') {
        return app.getLoginItemSettings().openAtLogin as AppSettings[T];
      }

      return this.get('settings')?.[key] as AppSettings[T];
    }

    const loginSettings = app.getLoginItemSettings();
    return {
      ...this.get('settings', APP_DEFAULT_SETTINGS),
      startup: loginSettings.openAtLogin,
    } as AppSettings;
  }

  setSettings(settings: Partial<AppSettings>) {
    const currentSettings = this.getSettings();
    if (Object.hasOwn(settings, 'startup')) {
      app.setLoginItemSettings({
        openAtLogin: settings.startup,
      });
    }

    this.set('settings', {
      ...currentSettings,
      ...settings,
    });
  }
}