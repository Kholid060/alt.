import { AppSettings } from '#packages/common/interface/app.interface';

export const APP_DEFAULT_SETTINGS: AppSettings = {
  startup: true,
  clearStateAfter: 10,
  upsertRestoreDuplicate: true,
};
