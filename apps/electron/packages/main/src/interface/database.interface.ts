import type { ExtensionConfig, ExtensionManifest } from '@repo/extension-core';
import type {
  NewExtensionConfig,
  SelectExtension,
  SelectExtensionConfig,
  SelectExtesionCommand,
} from '../db/schema/extension.schema';
import type { NewWorkflow, SelectWorkflow } from '../db/schema/workflow.schema';

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
  'database:get-workflow-list': () => DatabaseWorkflow[];
  'database:get-workflow': (
    workflowId: string,
  ) => DatabaseWorkflowDetail | null;
  'database:get-extension': (extensionId: string) => DatabaseExtension | null;
  'database:get-extension-manifest': (
    extensionId: string,
  ) => ExtensionManifest | null;
}

export interface DatabaseInsertEvents {
  'database:insert-workflow': (workflow: DatabaseWorkflowInsertPayload) => void;
  'database:insert-extension-config': (
    cofig: DatabaseExtensionConfigInsertPayload,
  ) => void;
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
  'database:update-extension-command': (
    extensionId: string,
    commandId: string,
    data: DatabaseExtensionCommandUpdatePayload,
  ) => void;
}

export interface DatabaseDeleteEvents {
  'database:delete-workflow': (workflowId: string) => void;
}

export type DatabaseEvents = DatabaseQueriesEvent &
  DatabaseUpdateEvents &
  DatabaseInsertEvents &
  DatabaseDeleteEvents;
