import type { AppSettings } from '#packages/common/interface/app.interface';
import { app } from 'electron';
import { store } from '../lib/store';

const defaultSettings: AppSettings = {
  startup: true,
  clearStateAfter: 10,
  upsertRestoreDuplicate: true,
};

class AppSettingsService {
  constructor() {}

  static init() {
    const settings = store.get('settings');
    if (settings) return;

    this.set(defaultSettings);
  }

  static get<T extends keyof AppSettings>(key?: T): AppSettings;
  static get<T extends keyof AppSettings>(key: T): AppSettings[T];
  static get<T extends keyof AppSettings>(
    key?: T,
  ): AppSettings[T] | AppSettings {
    if (key) {
      if (key === 'startup') {
        return app.getLoginItemSettings().openAtLogin as AppSettings[T];
      }

      return store.get('settings')?.[key] as AppSettings[T];
    }

    const loginSettings = app.getLoginItemSettings();
    return {
      ...store.get('settings', defaultSettings),
      startup: loginSettings.openAtLogin,
    } as AppSettings;
  }

  static set(settings: Partial<AppSettings>) {
    const currentSettings = this.get();
    if (Object.hasOwn(settings, 'startup')) {
      app.setLoginItemSettings({
        openAtLogin: settings.startup,
      });
    }

    store.set('settings', {
      ...currentSettings,
      ...settings,
    });
  }
}

export default AppSettingsService;
