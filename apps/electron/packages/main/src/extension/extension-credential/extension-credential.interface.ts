import {
  NewExtensionCredential,
  SelectExtension,
  SelectExtensionCredential,
} from '/@/db/schema/extension.schema';

export type ExtensionCredentialModel = SelectExtensionCredential;

export type ExtensionCredentialUpdatePayload = Partial<
  Pick<NewExtensionCredential, 'name'> & { value: Record<string, string> }
>;

export type ExtensionCredentialInsertPayload = Omit<
  NewExtensionCredential,
  'id' | 'value'
> & { value: Record<string, string> };

export interface ExtensionListPaginationPayload {
  filter?: {
    name?: string;
    extensionId?: string;
  };
  sort?: {
    asc: boolean;
    by: 'createdAt' | 'updatedAt' | 'name';
  };
  pagination?: {
    page: number;
    pageSize: number;
  };
}
export type ExtensionCredentialListPaginationItemModel = Pick<
  SelectExtensionCredential,
  'id' | 'name' | 'type' | 'updatedAt' | 'createdAt' | 'providerId'
> & { extension: { title: string; id: string }; tokenId: number | null };
export interface ExtensionCredentialListPaginationModel {
  count: number;
  items: ExtensionCredentialListPaginationItemModel[];
}

export type ExtensionCredentialDetailModel = Omit<
  SelectExtensionCredential,
  'value'
> & {
  value: Record<string, string>;
  oauthToken: null | { id: number; expiresTimestamp: number };
  extension: Pick<SelectExtension, 'title' | 'id' | 'credentials'>;
};
