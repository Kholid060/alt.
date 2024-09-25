import { AppSettings } from '#packages/common/interface/app.interface';

export interface AppStoreData {
  settings: AppSettings;
  isFirstTime?: boolean;
  lastCheckExtensionUpdate: string | null;
}

export type AppStoreRecord = Record<string, { $value: unknown }>;
