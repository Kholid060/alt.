import { CommandActions } from './command-action.interface';

export interface CommandJSONViewText {
  type: 'text';
  text: string;
  color?: 'destructive' | 'default' | 'muted' | 'primary';
  align?: 'start' | 'end' | 'justify';
  textStyle?:
    | 'heading-1'
    | 'heading-2'
    | 'heading-3'
    | 'heading-4'
    | 'body'
    | 'body-small';
}

export interface CommandJSONViewListItem {
  title: string;
  value: string;
  icon?: string;
  group?: string;
  subtitle?: string;
  description?: string;
  actions?: CommandActions[];
}

export interface CommandJSONViewList {
  type: 'list';
  shouldFilter?: boolean;
  items: CommandJSONViewListItem[];
}

export type CommandJSONViews = CommandJSONViewText | CommandJSONViewList;
