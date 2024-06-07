import {
  ExtensionBrowserTabContext,
  ExtensionCommandExecutePayload,
} from '#packages/common/interface/extension.interface';
import {
  DatabaseExtensionCommand,
  DatabaseExtensionListItem,
} from '#packages/main/src/interface/database.interface';
import { ExtensionCommand, ExtensionManifest } from '@repo/extension-core';
import { UiListItem } from '@repo/ui';

export interface CommandListItemCommandBuiltIn extends UiListItem {
  metadata: {
    type: 'builtin-command';
  };
}

export interface CommandListItemWorkflow extends UiListItem {
  metadata: {
    type: 'workflow';
    workflowId: string;
  };
}

export interface CommandListItemCommand extends UiListItem {
  metadata: {
    type: 'command';
    commandIcon: string;
    isFallback: boolean;
    fallbackStr?: string;
    command: DatabaseExtensionCommand;
    extension: DatabaseExtensionListItem;
    browserCtx?: ExtensionBrowserTabContext;
  };
}

export interface CommandListItemExtension extends UiListItem {
  metadata: {
    type: 'extension';
    extension: DatabaseExtensionListItem;
  };
}

export type CommandListItems =
  | CommandListItemCommand
  | CommandListItemWorkflow
  | CommandListItemExtension
  | CommandListItemCommandBuiltIn;

export interface CommandWorkerInitMessage {
  type: 'init';
  workerId: string;
  command: ExtensionCommand;
  manifest: ExtensionManifest;
  payload: ExtensionCommandExecutePayload;
}
