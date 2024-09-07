import Store from 'electron-store';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { AppSettings } from '#packages/common/interface/app.interface';
import { app, nativeTheme } from 'electron';
import { APP_DEFAULT_SETTINGS } from '/@/common/config/app.config';
import { BrowserWindowService } from '/@/browser-window/browser-window.service';

export interface AppStoreData {
  settings: AppSettings | null;
  lastCheckExtensionUpdate: string | null;
}

@Injectable()
export class AppStoreService
  extends Store<AppStoreData>
  implements OnModuleInit
{
  constructor(private browserWindow: BrowserWindowService) {
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
            theme: {
              default: 'system',
              enum: ['light', 'dark', 'system'],
            },
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

  onModuleInit() {
    nativeTheme.themeSource = this.get('settings.theme') ?? 'system';
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
    if (Object.hasOwn(settings, 'theme')) {
      nativeTheme.themeSource = settings.theme!;
    }

    const updatedSettings: AppSettings = {
      ...currentSettings,
      ...settings,
    };

    this.set('settings', updatedSettings);
    this.browserWindow.sendMessageToAllWindows({
      args: [updatedSettings],
      name: 'app:settings-changed',
    });

    if (settings.theme) {
      nativeTheme.themeSource = settings.theme;
    }
  }
}
