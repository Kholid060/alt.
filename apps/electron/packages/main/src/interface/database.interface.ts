import type {
  ExtensionConfigGetPayload,
  ExtensionConfigInsertPayload,
  ExtensionConfigUpdatePayload,
  ExtensionConfigWithSchemaModel,
} from '../extension/extension-config/extension-config.interface';
import type {
  ExtensionCommandInsertPayload,
  ExtensionCommandListFilter,
  ExtensionCommandListItemModel,
  ExtensionCommandModel,
  ExtensionCommandUpdatePayload,
} from '../extension/extension-command/extension-command.interface';
import type {
  ExtensionListFilterPayload,
  ExtensionListItemModel,
  ExtensionUpdatePayload,
  ExtensionWithCommandsModel,
  ExtensionWithCredListItemModel,
} from '../extension/extension.interface';
import type {
  ExtensionCredentialInsertPayload,
  ExtensionCredentialUpdatePayload,
  ExtensionCredentialListPaginationModel,
  ExtensionListPaginationPayload,
  ExtensionCredentialDetailModel,
} from '../extension/extension-credential/extension-credential.interface';
import type { ExtensionErrorListItemModel } from '../extension/extension-error/extension-error.interface';
import type {
  WorkflowDetailModel,
  WorkflowInsertPayload,
  WorkflowListFilter,
  WorkflowListItemModel,
  WorkflowUpdatePayload,
} from '../workflow/workflow.interface';
import type {
  WorkflowHistoryInsertPayload,
  WorkflowHistoryListPaginationFilter,
  WorkflowHistoryListPaginationModel,
  WorkflowHistoryRunningItemModel,
  WorkflowHistoryUpdatePayload,
} from '../workflow/workflow-history/workflow-history.interface';
import type { ExtensionManifest } from '@altdot/extension-core';

export interface DatabaseQueriesEvent {
  'database:get-extension-exists-arr': (
    extensionId: string[],
  ) => Record<string, boolean>;
  'database:get-extension-exists': (extensionId: string) => boolean;
  'database:get-command': (
    commandId: string | { commandId: string; extensionId: string },
  ) => ExtensionCommandModel | null;
  'database:get-extension-config': (
    query: ExtensionConfigGetPayload,
  ) => null | ExtensionConfigWithSchemaModel;
  'database:get-extension-creds': () => ExtensionWithCredListItemModel[];
  'database:get-extension-credential-list': (
    options?: ExtensionListPaginationPayload,
  ) => ExtensionCredentialListPaginationModel;
  'database:get-extension-credential-list-detail': (
    credentialId: string,
    maskSecret?: boolean,
  ) => ExtensionCredentialDetailModel | null;
  'database:get-extension-list': (
    filter?: ExtensionListFilterPayload,
  ) => ExtensionListItemModel[];
  'database:get-workflow-list': (
    options?: WorkflowListFilter,
  ) => WorkflowListItemModel[];
  'database:get-workflow': (workflowId: string) => WorkflowDetailModel | null;
  'database:get-command-list': (
    filter?: ExtensionCommandListFilter,
  ) => ExtensionCommandListItemModel[];
  'database:get-extension': (
    extensionId: string,
  ) => ExtensionWithCommandsModel | null;
  'database:get-extension-manifest': (
    extensionId: string,
  ) => ExtensionManifest | null;
  'database:extension-command-exists': (
    ids: string[],
  ) => Record<string, boolean>;
  'database:get-extension-errors-list': (
    extensionId: string,
  ) => ExtensionErrorListItemModel[];
  'database:get-workflow-history-list': (
    filter?: WorkflowHistoryListPaginationFilter,
  ) => WorkflowHistoryListPaginationModel;
  'database:get-running-workflows': () => WorkflowHistoryRunningItemModel[];
}

export interface DatabaseInsertEvents {
  'database:insert-workflow': (workflow: WorkflowInsertPayload) => string;
  'database:insert-workflow-history': (
    history: WorkflowHistoryInsertPayload,
  ) => number;
  'database:insert-extension-config': (
    config: ExtensionConfigInsertPayload,
  ) => void;
  'database:insert-extension-command': (
    command: ExtensionCommandInsertPayload,
  ) => void;
  'database:insert-extension-credential': (
    credential: ExtensionCredentialInsertPayload,
  ) => string;
}

export interface DatabaseUpdateEvents {
  'database:update-extension-config': (
    configId: string,
    data: ExtensionConfigUpdatePayload,
  ) => void;
  'database:update-workflow': (
    workflowId: string,
    data: WorkflowUpdatePayload,
  ) => void;
  'database:update-extension': (
    extensionId: string,
    data: ExtensionUpdatePayload,
  ) => void;
  'database:update-workflow-history': (
    historyId: number,
    data: WorkflowHistoryUpdatePayload,
  ) => void;
  'database:update-extension-command': (
    extensionId: string,
    commandId: string,
    data: ExtensionCommandUpdatePayload,
  ) => void;
  'database:update-extension-credential': (
    credentialId: string,
    data: ExtensionCredentialUpdatePayload,
  ) => void;
}

export interface DatabaseDeleteEvents {
  'database:delete-workflow': (workflowId: string) => void;
  'database:delete-extension-command': (id: string) => void;
  'database:delete-extension-errors': (id: number[]) => void;
  'database:delete-extension-credential': (id: string) => void;
  'database:delete-workflow-history': (historyId: number | number[]) => void;
}

export type DatabaseEvents = DatabaseQueriesEvent &
  DatabaseUpdateEvents &
  DatabaseInsertEvents &
  DatabaseDeleteEvents;
