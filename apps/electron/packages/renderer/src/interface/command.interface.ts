import {
  ExtensionData,
  ExtensionDataBase,
} from '#common/interface/extension.interface';
import { CommandLaunchContext } from '@repo/extension';
import { ExtensionCommand, ExtensionManifest } from '@repo/extension-core';
import { UiListItem } from '@repo/ui';

export interface CommandListItemCommandBuiltIn extends UiListItem {
  metadata: {
    type: 'builtin-command';
  };
}

export interface CommandListItemCommand extends UiListItem {
  metadata: {
    type: 'command';
    commandIcon: string;
    command: ExtensionCommand;
    extension: ExtensionDataBase;
  };
}

export interface CommandListItemExtension extends UiListItem {
  metadata: {
    type: 'extension';
    extension: ExtensionData;
  };
}

export type CommandListItems =
  | CommandListItemCommand
  | CommandListItemExtension
  | CommandListItemCommandBuiltIn;

export interface CommandWorkerInitMessage {
  key: string;
  type: 'init';
  workerId: string;
  manifest: ExtensionManifest;
  launchContext: CommandLaunchContext;
  commandType: ExtensionCommand['type'];
}
