import { ExtensionCommand } from '@repo/extension-core';
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

export interface CommandListMetadataCommandItem {
  type: 'command';
  extensionId: string;
  extensionTitle: string;
  command: ExtensionCommand;
}

export interface CommandListMetadataExtensionItem {
  type: 'extension';
  extensionId: string;
}

export type CommandListMetadata =
  | CommandListMetadataExtensionItem
  | CommandListMetadataCommandItem;
