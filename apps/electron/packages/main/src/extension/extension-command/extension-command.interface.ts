import {
  NewExtensionCommand,
  SelectExtension,
  SelectExtensionCommand,
} from '../../db/schema/extension.schema';

export interface ExtensionCommandModel extends SelectExtensionCommand {
  extension: Pick<
    SelectExtension,
    | 'id'
    | 'icon'
    | 'title'
    | 'isError'
    | 'isLocal'
    | 'isDisabled'
    | 'errorMessage'
  >;
}

export interface ExtensionCommandListFilter {
  type?: 'user-script';
}
export type ExtensionCommandListItemModel = SelectExtensionCommand;

export type ExtensionCommandInsertPayload = Omit<NewExtensionCommand, 'id'>;

export type ExtensionCommandUpdatePayload = Partial<
  Pick<
    ExtensionCommandModel,
    | 'alias'
    | 'shortcut'
    | 'subtitle'
    | 'isFallback'
    | 'isDisabled'
    | 'customSubtitle'
  >
>;

export type ExtensionCommandExistsItem =
  | {
      exists: true;
      isLocal: boolean;
      extensionId: string;
    }
  | { exists: false; isLocal: null; extensionId: null };
