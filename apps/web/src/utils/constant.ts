import { ExtensionCommandType } from '@altdot/shared';

export enum UserRole {
  User = 'user',
  Admin = 'admin',
}

export const EXTENSION_COMMAND_TYPE_NAME: Record<ExtensionCommandType, string> =
  {
    view: 'View',
    action: 'Action',
    script: 'Script',
  } as const;

export const EXT_BANNER_NAME_REGEX = /banner-[0-9]*.png/;

export const APP_TITLE = 'alt.';
