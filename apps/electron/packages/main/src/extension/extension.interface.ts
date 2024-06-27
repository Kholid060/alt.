import {
  NewExtension,
  SelectExtension,
  SelectExtensionCommand,
} from '/@/db/schema/extension.schema';

export type ExtensionInsertPayload = NewExtension;

export type ExtensionUpdatePayload = Partial<Omit<NewExtension, 'id'>>;

export interface ExtensionListItemModel
  extends Pick<
    SelectExtension,
    | 'id'
    | 'path'
    | 'icon'
    | 'title'
    | 'config'
    | 'version'
    | 'isError'
    | 'isLocal'
    | 'updatedAt'
    | 'isDisabled'
    | 'description'
    | 'errorMessage'
  > {
  errorsCount: number;
  commands: SelectExtensionCommand[];
}

export interface ExtensionListFilterPayload {
  activeOnly?: boolean;
  excludeBuiltIn?: boolean;
}
