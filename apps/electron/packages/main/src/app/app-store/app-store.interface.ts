import { AppSettings } from '#packages/common/interface/app.interface';

export interface AppStoreData {
  settings: AppSettings;
  lastCheckExtensionUpdate: string | null;
}

export type AppStoreRecord = Record<string, { $value: unknown }>;
