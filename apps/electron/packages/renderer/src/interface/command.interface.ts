import {
  ExtensionBrowserTabContext,
  ExtensionCommandExecutePayload,
} from '#packages/common/interface/extension.interface';
import { SelectExtensionCommand } from '#packages/main/src/db/schema/extension.schema';
import { ExtensionListItemModel } from '#packages/main/src/extension/extension.interface';
import { ExtensionManifest } from '@altdot/extension';
import { ExtensionCommand } from '@altdot/extension/dist/extension-manifest';
import { UiListItem } from '@altdot/ui';

export interface CommandListItemCommandBuiltIn extends UiListItem {
  metadata: {
    isFallback?: boolean;
    type: 'builtin-command';
  };
}

export interface CommandListItemWorkflow extends UiListItem {
  metadata: {
    type: 'workflow';
    isPinned?: boolean;
    workflowId: string;
  };
}

export interface CommandListItemCommand extends UiListItem {
  metadata: {
    type: 'command';
    commandIcon: string;
    isFallback: boolean;
    fallbackStr?: string;
    command: SelectExtensionCommand;
    extension: ExtensionListItemModel;
    browserCtx?: ExtensionBrowserTabContext;
  };
}

export interface CommandListItemExtension extends UiListItem {
  metadata: {
    type: 'extension';
    extension: ExtensionListItemModel;
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
