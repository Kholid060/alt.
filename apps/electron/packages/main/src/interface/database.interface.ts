import type { ExtensionConfig, ExtensionManifest } from '@repo/extension-core';
import type {
  NewExtensionCommand,
  NewExtensionConfig,
  SelectExtension,
  SelectExtensionConfig,
  SelectExtesionCommand,
} from '../db/schema/extension.schema';
import type {
  NewWorkflow,
  NewWorkflowHistory,
  SelectWorkflow,
  SelectWorkflowHistory,
} from '../db/schema/workflow.schema';

export type DatabaseExtensionCommand = SelectExtesionCommand;

export interface DatabaseExtensionCommandWithExtension
  extends DatabaseExtensionCommand {
  extension: Pick<
    SelectExtension,
    | 'id'
    | 'icon'
    | 'title'
    | 'isError'
    | 'isLocal'
    | 'isDisabled'
    | 'errorMessage'
  >;
}

export interface DatabaseExtension extends SelectExtension {
  commands: DatabaseExtensionCommand[];
}

export type DatabaseExtensionListItem = Pick<
  DatabaseExtension,
  | 'title'
  | 'version'
  | 'description'
  | 'isLocal'
  | 'icon'
  | 'config'
  | 'errorMessage'
  | 'id'
  | 'commands'
  | 'isError'
  | 'isDisabled'
>;

export type DatabaseExtensionUpdatePayload = Partial<
  Pick<DatabaseExtension, 'isDisabled'>
>;

export type DatabaseExtensionCommandUpdatePayload = Partial<
  Pick<DatabaseExtensionCommand, 'shortcut' | 'subtitle'>
>;

export type DatabaseExtensionCommandInsertPayload = Omit<
  NewExtensionCommand,
  'id'
>;

export type DatabaseWorkflow = Pick<
  SelectWorkflow,
  | 'id'
  | 'icon'
  | 'description'
  | 'name'
  | 'isDisabled'
  | 'updatedAt'
  | 'createdAt'
>;

export type DatabaseWorkflowDetail = SelectWorkflow;

export type DatabaseWorkflowInsertPayload = Omit<
  NewWorkflow,
  'id' | 'createdAt' | 'updatedAt'
>;

export type DatabaseWorkflowUpdatePayload = Partial<
  Omit<SelectWorkflow, 'id' | 'createdAt' | 'updatedAt'>
>;

export type DatabaseWorkflowHistoryInsertPayload = Omit<
  NewWorkflowHistory,
  'id'
>;
export type DatabaseWorkflowHistoryUpdatePayload = Partial<
  Pick<
    SelectWorkflowHistory,
    | 'duration'
    | 'startedAt'
    | 'endedAt'
    | 'errorLocation'
    | 'errorMessage'
    | 'status'
  >
>;

export type DatabaseExtensionConfig = Omit<SelectExtensionConfig, 'id'>;
export type DatabaseExtensionConfigWithSchema = DatabaseExtensionConfig & {
  config: ExtensionConfig[];
} & {
  commandIcon: string;
  commandTitle: string;
  extensionIcon: string;
  extensionTitle: string;
};
export type DatabaseExtensionConfigUpdatePayload = Partial<
  Pick<NewExtensionConfig, 'value'>
>;
export type DatabaseExtensionConfigInsertPayload = Pick<
  NewExtensionConfig,
  'value' | 'extensionId' | 'configId'
>;

export interface DatabaseGetExtensionConfig {
  configId: string;
  commandId?: string;
  extensionId: string;
}

export type DatabaseWorkfowListQueryOptions = 'commands';

export type DatabaseWorkflowHistory = SelectWorkflowHistory & {
  workflow: Pick<DatabaseWorkflow, 'name' | 'description'>;
};

export interface DatabaseWorkflowHistoryListOptions {
  filter?: {
    name?: string;
  };
  sort?: {
    asc: boolean;
    by: 'startedAt' | 'name' | 'duration';
  };
  pagination?: {
    page: number;
    pageSize: number;
  };
}

export type DatabaseExtensionCommandListFilter = 'user-script';

export interface DatabaseQueriesEvent {
  'database:get-command': (
    commandId: string | { commandId: string; extensionId: string },
  ) => DatabaseExtensionCommandWithExtension | null;
  'database:get-extension-config': (
    query: DatabaseGetExtensionConfig,
  ) => null | DatabaseExtensionConfigWithSchema;
  'database:get-extension-list': (
    activeExtOnly?: boolean,
  ) => DatabaseExtensionListItem[];
  'database:get-workflow-list': (
    options?: DatabaseWorkfowListQueryOptions,
  ) => DatabaseWorkflow[];
  'database:get-workflow': (
    workflowId: string,
  ) => DatabaseWorkflowDetail | null;
  'database:get-command-list': (
    filter?: DatabaseExtensionCommandListFilter,
  ) => SelectExtesionCommand[];
  'database:get-extension': (extensionId: string) => DatabaseExtension | null;
  'database:get-extension-manifest': (
    extensionId: string,
  ) => ExtensionManifest | null;
  'database:get-workflow-history': (
    historyId: number,
  ) => DatabaseWorkflowHistory | null;
  'database:get-workflow-history-list': (
    options?: DatabaseWorkflowHistoryListOptions,
  ) => { count: number; items: DatabaseWorkflowHistory[] };
}

export interface DatabaseInsertEvents {
  'database:insert-workflow': (
    workflow: DatabaseWorkflowInsertPayload,
  ) => string;
  'database:insert-workflow-history': (
    history: DatabaseWorkflowHistoryInsertPayload,
  ) => number;
  'database:insert-extension-config': (
    config: DatabaseExtensionConfigInsertPayload,
  ) => void;
  'database:insert-extension-command': (
    command: DatabaseExtensionCommandInsertPayload,
  ) => string;
}

export interface DatabaseUpdateEvents {
  'database:update-extension-config': (
    configId: string,
    data: DatabaseExtensionConfigUpdatePayload,
  ) => void;
  'database:update-workflow': (
    workflowId: string,
    data: DatabaseWorkflowUpdatePayload,
    options?: Partial<{
      omitDBChanges: boolean;
      ignoreModified: boolean;
    }>,
  ) => void;
  'database:update-extension': (
    extensionId: string,
    data: DatabaseExtensionUpdatePayload,
  ) => void;
  'database:update-workflow-history': (
    historyId: number,
    data: DatabaseWorkflowHistoryUpdatePayload,
  ) => void;
  'database:update-extension-command': (
    extensionId: string,
    commandId: string,
    data: DatabaseExtensionCommandUpdatePayload,
  ) => void;
}

export interface DatabaseDeleteEvents {
  'database:delete-workflow': (workflowId: string) => void;
  'database:delete-extension-command': (id: string | string[]) => void;
  'database:delete-workflow-history': (historyId: number | number[]) => void;
}

export type DatabaseEvents = DatabaseQueriesEvent &
  DatabaseUpdateEvents &
  DatabaseInsertEvents &
  DatabaseDeleteEvents;
