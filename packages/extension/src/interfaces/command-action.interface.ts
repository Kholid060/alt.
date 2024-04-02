export interface CommandActionBase {
  defaultAction?: boolean;
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

export type CommandActions =
  | CommandActionPaste
  | CommandActionCopy
  | CommandActionOpenURL
  | CommandActionShowInFolder
  | CommandActionMoveToTrash;
