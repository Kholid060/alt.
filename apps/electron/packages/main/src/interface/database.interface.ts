import type { ExtensionConfig, ExtensionManifest } from '@repo/extension-core';
import type {
  SelectExtension,
  SelectExtesionCommand,
} from '../db/schema/extension.schema';
import type { NewWorkflow, SelectWorkflow } from '../db/schema/workflow.schema';

export type DatabaseExtensionCommand = SelectExtesionCommand;

export interface DatabaseExtensionCommandWithExtension
  extends DatabaseExtensionCommand {
  extension: Pick<
    SelectExtension,
    'isDisabled' | 'errorMessage' | 'icon' | 'id' | 'title' | 'isError'
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

export interface DatabaseQueriesEvent {
  'database:get-command': (
    commandId: string | { commandId: string; extensionId: string },
  ) => DatabaseExtensionCommandWithExtension | null;
  'database:get-config': (
    extensionId: string,
    commandId?: string,
  ) => null | ExtensionConfig[];
  'database:update-extension': (
    extensionId: string,
    data: DatabaseExtensionUpdatePayload,
  ) => void;
  'database:update-extension-command': (
    extensionId: string,
    commandId: string,
    data: DatabaseExtensionCommandUpdatePayload,
  ) => void;
  'database:get-extension-list': (
    activeExtOnly?: boolean,
  ) => DatabaseExtensionListItem[];
  'database:get-workflow-list': () => DatabaseWorkflow[];
  'database:get-workflow': (
    workflowId: string,
  ) => DatabaseWorkflowDetail | null;
  'database:update-workflow': (
    workflowId: string,
    data: DatabaseWorkflowUpdatePayload,
    options?: Partial<{
      omitDBChanges: boolean;
      ignoreModified: boolean;
    }>,
  ) => void;
  'database:insert-workflow': (workflow: DatabaseWorkflowInsertPayload) => void;
  'database:delete-workflow': (workflowId: string) => void;
  'database:get-extension': (extensionId: string) => DatabaseExtension | null;
  'database:get-extension-manifest': (
    extensionId: string,
  ) => ExtensionManifest | null;
}
