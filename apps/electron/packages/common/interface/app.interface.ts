import type { SelectWorkflow } from '../../main/src/db/schema/workflow.schema';

export type AppTheme = 'dark' | 'light' | 'system';

export interface AppSettings {
  theme: AppTheme;
  startup: boolean;
  clearStateAfter: number;
  upsertRestoreDuplicate: boolean;
}

export type AppBackupWorkflowData = Pick<
  SelectWorkflow,
  | 'id'
  | 'name'
  | 'icon'
  | 'edges'
  | 'nodes'
  | 'viewport'
  | 'settings'
  | 'variables'
  | 'isDisabled'
  | 'description'
>;

export interface AppVersions {
  os: string;
  app: string;
}

export interface AppMessagePortBridgeOptions {
  noThrow?: boolean;
  ensureWindow?: boolean;
}
