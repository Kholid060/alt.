import { Injectable, OnModuleInit } from '@nestjs/common';
import { app, nativeTheme } from 'electron';
import { APP_DEFAULT_SETTINGS } from '/@/common/config/app.config';
import { BrowserWindowService } from '/@/browser-window/browser-window.service';
import { DBService } from '/@/db/db.service';
import { AppStoreData, AppStoreRecord } from './app-store.interface';
import { SelectStore, store } from '/@/db/schema/store.schema';
import { AppSettings } from '#packages/common/interface/app.interface';

@Injectable()
export class AppStoreService implements OnModuleInit {
  constructor(
    private browserWindow: BrowserWindowService,
    private dbService: DBService,
  ) {}

  async onModuleInit() {
    nativeTheme.themeSource = await this.getSettings('theme');
  }

  private rowsToRecord<T extends AppStoreRecord = AppStoreRecord>(
    rows: SelectStore[],
  ) {
    return rows.reduce<Record<string, unknown>>((acc, curr) => {
      acc[curr.key] = curr.value?.$value;

      return acc;
    }, {}) as T;
  }

  async get<T extends keyof AppStoreData>(
    key: T,
    def: AppStoreData[T],
  ): Promise<AppStoreData[T]>;
  async get<T extends keyof AppStoreData>(
    key: T,
    def?: AppStoreData[T],
  ): Promise<AppStoreData[T] | null>;
  async get<T extends keyof AppStoreData>(key?: T): Promise<AppStoreData>;
  async get<T extends keyof AppStoreData>(key: T, def?: unknown) {
    if (key) {
      const result = await this.dbService.db.query.store.findFirst({
        where(fields, operators) {
          return operators.eq(fields.key, key);
        },
      });

      return result?.value?.$value ?? def ?? null;
    }

    return this.rowsToRecord(await this.dbService.db.query.store.findMany());
  }

  async set<T extends keyof AppStoreData>(
    key: T,
    value: AppStoreData[T],
  ): Promise<void> {
    await this.dbService.db
      .insert(store)
      .values({ key, value: { $value: value } })
      .onConflictDoUpdate({
        set: { value: { $value: value } },
        target: store.key,
      });
  }

  async getSettings<T extends keyof AppSettings>(
    key: T,
  ): Promise<AppSettings[T]>;
  async getSettings<T extends keyof AppSettings>(key?: T): Promise<AppSettings>;
  async getSettings<T extends keyof AppSettings>(key?: T) {
    const settings = await this.get('settings', APP_DEFAULT_SETTINGS);
    if (key) {
      if (key === 'startup') {
        return app.getLoginItemSettings().openAtLogin as AppSettings[T];
      }

      return settings[key];
    }

    const loginSettings = app.getLoginItemSettings();

    return {
      ...settings,
      startup: loginSettings.openAtLogin,
    } as AppSettings;
  }

  async setSettings(settings: Partial<AppSettings>) {
    const currentSettings = await this.get('settings', APP_DEFAULT_SETTINGS);
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

    await this.set('settings', updatedSettings);
    this.browserWindow.sendMessageToAllWindows({
      args: [updatedSettings],
      name: 'app:settings-changed',
    });

    if (settings.theme) {
      nativeTheme.themeSource = settings.theme;
    }
  }
}
