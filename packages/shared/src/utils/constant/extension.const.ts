import { ArrayUnion } from '../../interfaces/utils.interface';

export const EXTENSION_CATEGORIES = [
  'Applications',
  'Automation',
  'Developer Tools',
  'Productivity',
  'Scripts',
  'Web',
  'Other',
] as const;
export type ExtensionCategories = ArrayUnion<typeof EXTENSION_CATEGORIES>;

export const EXTENSION_PERMISSIONS = [
  'fs',
  'shell',
  'sqlite',
  'browser',
  'storage',
  'fs.read',
  'fs.write',
  'clipboard',
  'browser.tabs',
  'notifications',
  'installed-apps',
] as const;
export type ExtensionPermissions = ArrayUnion<typeof EXTENSION_PERMISSIONS>;

export const EXTENSION_COMMAND_CONTEXT = ['all'] as const;

export const EXTENSION_COMMAND_TYPE = [
  'view',
  'action',
  'script',
  'view:json',
] as const;
export type ExtensionCommandType = ArrayUnion<typeof EXTENSION_COMMAND_TYPE>;

export const EXTENSION_COMMAND_ARGUMENT_TYPE = [
  'toggle',
  'select',
  'input:text',
  'input:number',
  'input:password',
] as const;
export type ExtensionCommandArgumentType = ArrayUnion<
  typeof EXTENSION_COMMAND_ARGUMENT_TYPE
>;

export const EXTENSION_CONFIG_TYPE = [
  'select',
  'toggle',
  'input:text',
  'input:file',
  'input:number',
  'input:password',
  'input:directory',
] as const;
export type ExtensionConfigType = ArrayUnion<typeof EXTENSION_CONFIG_TYPE>;
