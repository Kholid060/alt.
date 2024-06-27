import {
  NewExtensionCommand,
  SelectExtension,
  SelectExtensionCommand,
} from '/@/db/schema/extension.schema';

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
