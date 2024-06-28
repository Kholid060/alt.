import type {
  ExtensionConfig,
  ExtensionConfigType,
  ExtensionManifest,
} from '@alt-dot/extension-core';
import type {
  NewExtensionCommand,
  NewExtensionConfig,
  NewExtensionCredential,
  NewExtensionCredentialOauthTokens,
  SelectExtension,
  SelectExtensionConfig,
  SelectExtensionCredential,
  SelectExtensionError,
  SelectExtensionCommand,
} from '../db/schema/extension.schema';
import type {
  NewWorkflow,
  NewWorkflowHistory,
  SelectWorkflow,
  SelectWorkflowHistory,
} from '../db/schema/workflow.schema';
import type { ExtensionCredential } from '@alt-dot/extension-core/src/client/manifest/manifest-credential';
import {
  ExtensionConfigInsertPayload,
  ExtensionConfigUpdatePayload,
  ExtensionConfigWithSchemaModel,
} from '../extension/extension-config/extension-config.interface';
import {
  ExtensionCommandListFilter,
  ExtensionCommandModel,
} from '../extension/extension-command/extension-command.interface';
import {
  ExtensionListFilterPayload,
  ExtensionListItemModel,
  ExtensionUpdatePayload,
  ExtensionWithCredListItemModel,
} from '../extension/extension.interface';
import {
  ExtensionCredentialInsertPayload,
  ExtensionCredentialUpdatePayload,
  ExtensionCredentialListPaginationModel,
  ExtensionListPaginationPayload,
  ExtensionCredentialDetailModel,
} from '../extension/extension-credential/extension-credential.interface';
import { ExtensionErrorListItemModel } from '../extension/extension-error/extension-error.interface';
import { WorkflowDetailModel } from '../workflow/workflow.interface';

export type DatabaseExtensionCommand = SelectExtensionCommand;

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
  | 'updatedAt'
  | 'id'
  | 'path'
  | 'commands'
  | 'isError'
  | 'isDisabled'
> & { errorsCount: number };

export type DatabaseExtensionUpdatePayload = Partial<
  Pick<DatabaseExtension, 'isDisabled'>
>;

export type DatabaseExtensionCommandUpdatePayload = Partial<
  Pick<
    DatabaseExtensionCommand,
    | 'alias'
    | 'shortcut'
    | 'subtitle'
    | 'isFallback'
    | 'isDisabled'
    | 'customSubtitle'
  >
>;

export type DatabaseExtensionCommandInsertPayload = Omit<
  NewExtensionCommand,
  'id'
>;

export type DatabaseExtensionCredentialInsertPayload = Omit<
  NewExtensionCredential,
  'id' | 'value'
> & { value: Record<string, string> };
export type DatabaseExtensionCredentialUpdatePayload = Partial<
  Pick<NewExtensionCredential, 'name'> & {
    value: Record<string, string>;
  }
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

export type DatabaseWorkflowUpsertPayload = Omit<
  NewWorkflow,
  'createdAt' | 'updatedAt'
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
    | 'runnerId'
    | 'endedAt'
    | 'errorLocation'
    | 'errorMessage'
    | 'status'
  >
>;

export type DatabaseWorkflowRunning = Pick<
  DatabaseWorkflowHistory,
  'runnerId' | 'startedAt'
> & { workflow: { name: string; icon: string | null } };

export type DatabaseExtensionConfig = Omit<
  SelectExtensionConfig,
  'id' | 'encryptedValue'
>;
export type DatabaseExtensionConfigWithSchema = DatabaseExtensionConfig & {
  config: ExtensionConfig[];
} & {
  commandIcon: string;
  commandTitle: string;
  extensionIcon: string;
  extensionTitle: string;
};

export type DatabaseExtensionConfigValue = Record<
  string,
  { type: ExtensionConfigType; value: unknown }
>;
export type DatabaseExtensionConfigUpdatePayload = Partial<{
  value: DatabaseExtensionConfigValue;
}>;
export type DatabaseExtensionConfigInsertPayload = Pick<
  NewExtensionConfig,
  'extensionId' | 'configId'
> & { value: DatabaseExtensionConfigValue };

export type DatabaseExtensionCredOauthTokenInsertPayload = Omit<
  NewExtensionCredentialOauthTokens,
  'id' | 'createdAt' | 'updatedAt' | 'refreshToken' | 'accessToken'
> & { refreshToken?: string; accessToken: string };
export type DatabaseExtensionCredOauthTokenUpdatePayload = Partial<
  Omit<
    NewExtensionCredentialOauthTokens,
    'id' | 'createdAt' | 'updatedAt' | 'refreshToken' | 'accessToken'
  > & { refreshToken: string; accessToken: string }
>;

export interface DatabaseGetExtensionConfig {
  configId: string;
  commandId?: string;
  extensionId: string;
}

export type DatabaseExtensionCredentials = Pick<
  SelectExtension,
  'id' | 'title' | 'credentials'
>[];
export interface DatabaseExtensionCredentialsValueListOptions {
  filter?: {
    name?: string;
    extensionId?: string;
  };
  sort?: {
    asc: boolean;
    by: 'createdAt' | 'updatedAt' | 'name';
  };
  pagination?: {
    page: number;
    pageSize: number;
  };
}
export type DatabaseExtensionCredentialsValueList = (Pick<
  SelectExtensionCredential,
  'id' | 'name' | 'type' | 'updatedAt' | 'createdAt' | 'providerId'
> & { extension: { title: string; id: string }; tokenId: number | null })[];
export type DatabaseExtensionCredentialsValueDetail = Omit<
  SelectExtensionCredential,
  'value'
> & {
  value: Record<string, string>;
  oauthToken: null | { id: number; expiresTimestamp: number };
  extension: { title: string; id: string; credentials: ExtensionCredential[] };
};

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

export type DatabaseExtensionErrorsListItem = Pick<
  SelectExtensionError,
  'id' | 'message' | 'title' | 'createdAt'
>;

export interface DatabaseExtensionListFilter {
  activeOnly?: boolean;
  excludeBuiltIn?: boolean;
}

export interface DatabaseQueriesEvent {
  'database:get-extension-exists': (extensionId: string) => boolean;
  'database:get-command': (
    commandId: string | { commandId: string; extensionId: string },
  ) => ExtensionCommandModel | null;
  'database:get-extension-config': (
    query: DatabaseGetExtensionConfig,
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
    options?: DatabaseWorkfowListQueryOptions,
  ) => DatabaseWorkflow[];
  'database:get-workflow': (workflowId: string) => WorkflowDetailModel | null;
  'database:get-command-list': (
    filter?: ExtensionCommandListFilter,
  ) => SelectExtensionCommand[];
  'database:get-extension': (extensionId: string) => DatabaseExtension | null;
  'database:get-extension-manifest': (
    extensionId: string,
  ) => ExtensionManifest | null;
  'database:get-workflow-history': (
    historyId: number,
  ) => DatabaseWorkflowHistory | null;
  'database:extension-command-exists': (
    ids: string[],
  ) => Record<string, boolean>;
  'database:get-extension-errors-list': (
    extensionId: string,
  ) => ExtensionErrorListItemModel[];
  'database:get-workflow-history-list': (
    options?: DatabaseWorkflowHistoryListOptions,
  ) => { count: number; items: DatabaseWorkflowHistory[] };
  'database:get-running-workflows': () => DatabaseWorkflowRunning[];
}

export interface DatabaseInsertEvents {
  'database:insert-workflow': (
    workflow: DatabaseWorkflowInsertPayload,
  ) => string;
  'database:insert-workflow-history': (
    history: DatabaseWorkflowHistoryInsertPayload,
  ) => number;
  'database:insert-extension-config': (
    config: ExtensionConfigInsertPayload,
  ) => void;
  'database:insert-extension-command': (
    command: DatabaseExtensionCommandInsertPayload,
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
    data: DatabaseWorkflowUpdatePayload,
    options?: Partial<{
      omitDBChanges: boolean;
      ignoreModified: boolean;
    }>,
  ) => void;
  'database:update-extension': (
    extensionId: string,
    data: ExtensionUpdatePayload,
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
