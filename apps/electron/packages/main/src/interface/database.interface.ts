import type { ExtensionConfig, ExtensionManifest } from '@repo/extension-core';
import type {
  SelectExtension,
  SelectExtesionCommand,
} from '../db/schema/extension.schema';

export type DatabaseExtensionCommand = SelectExtesionCommand;

export interface DatabaseExtensionCommandWithExtension
  extends DatabaseExtensionCommand {
  extension: Pick<
    SelectExtension,
    'isDisabled' | 'errorMessage' | 'icon' | 'id' | 'title' | 'isError'
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
  | 'id'
  | 'commands'
  | 'isError'
  | 'isDisabled'
>;

export type DatabaseExtensionUpdatePayload = Partial<
  Pick<DatabaseExtension, 'isDisabled'>
>;

export interface DatabaseQueriesEvent {
  'database:get-command': (
    commandId: string | { commandId: string; extensionId: string },
  ) => DatabaseExtensionCommandWithExtension | null;
  'database:get-config': (
    extensionId: string,
    commandId?: string,
  ) => null | ExtensionConfig[];
  'database:update-extension': (
    extensionId: string,
    data: DatabaseExtensionUpdatePayload,
  ) => void;
  'database:get-extension-list': () => DatabaseExtensionListItem[];
  'database:get-extension': (extensionId: string) => DatabaseExtension | null;
  'database:get-extension-manifest': (
    extensionId: string,
  ) => ExtensionManifest | null;
}
