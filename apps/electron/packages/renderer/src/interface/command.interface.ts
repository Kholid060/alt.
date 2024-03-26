import {
  ExtensionData,
  ExtensionDataBase,
} from '#common/interface/extension.interface';
import { CommandLaunchContext } from '@repo/extension';
import { ExtensionCommand, ExtensionManifest } from '@repo/extension-core';
import { UiListItem } from '@repo/ui';
import { SetRequired } from 'type-fest';

interface CommandActionBase {
  icon?: string;
  title?: string;
  shortcut: string;
}

export interface CommandActionPaste extends CommandActionBase {
  type: 'paste';
  content: string;
}

export interface CommandActionCopy extends CommandActionBase {
  type: 'copy';
  content: string;
}

export interface CommandActionOpenURL extends CommandActionBase {
  url: string;
  type: 'open-url';
}

export interface CommandActionShowInFolder extends CommandActionBase {
  path: string;
  type: 'show-in-folder';
}

export interface CommandActionMoveToTrash extends CommandActionBase {
  path: string;
  type: 'move-to-trash';
}

export interface CommandActionCustom
  extends SetRequired<CommandActionBase, 'icon' | 'title'> {
  type: 'custom';
  callback: () => void;
}

export type CommandActions =
  | CommandActionPaste
  | CommandActionCopy
  | CommandActionOpenURL
  | CommandActionShowInFolder
  | CommandActionMoveToTrash
  | CommandActionCustom;

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
}
