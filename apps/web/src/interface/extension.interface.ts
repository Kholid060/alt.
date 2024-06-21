import {
  EXTENSION_CATEGORIES,
  EXTENSION_PERMISSIONS,
  ExtensionCommandType,
} from '@alt-dot/extension-core';
import { UserProfile } from './user.interface';

export interface ExtensionCommand {
  name: string;
  title: string;
  description?: string;
  type: ExtensionCommandType;
}

export type ExtensionStatus = 'in-review' | 'rejected' | 'published';
export type ExtensionCategories = (typeof EXTENSION_CATEGORIES)[number];
export type ExtensionPermissions = (typeof EXTENSION_PERMISSIONS)[number];

export interface ExtensionEntry {
  status: ExtensionStatus;
  rejectReason: string | null;
}

export type ExtensionOwner = Pick<
  UserProfile,
  'avatarUrl' | 'name' | 'username'
>;

export interface Extension {
  id: string;
  name: string;
  title: string;
  version: string;
  iconUrl: string;
  banners: string[];
  sourceUrl: string;
  createdAt: string;
  updatedAt: string;
  apiVersion: string;
  description: string;
  relativePath: string;
  isPublished: boolean;
  downloadCount: number;
  owner: ExtensionOwner;
  entry: ExtensionEntry | null;
  commands: ExtensionCommand[];
  categories: ExtensionCategories[];
  permissions?: ExtensionPermissions[];
}

export type ExtensionCreatePayload = Pick<
  Extension,
  | 'name'
  | 'title'
  | 'version'
  | 'banners'
  | 'iconUrl'
  | 'commands'
  | 'sourceUrl'
  | 'apiVersion'
  | 'categories'
  | 'permissions'
  | 'description'
  | 'relativePath'
>;

export type ExtensionListItem = Pick<
  Extension,
  | 'id'
  | 'name'
  | 'title'
  | 'iconUrl'
  | 'version'
  | 'createdAt'
  | 'updatedAt'
  | 'description'
  | 'downloadCount'
>;

export type ExtensionDetail = ExtensionListItem &
  Pick<
    Extension,
    | 'banners'
    | 'commands'
    | 'sourceUrl'
    | 'categories'
    | 'permissions'
    | 'description'
    | 'relativePath'
  >;

export type ExtensionStoreListItem = ExtensionListItem &
  Pick<Extension, 'commands'> & {
    owner: ExtensionOwner;
  };

export type ExtensionStoreDetail = Pick<
  Extension,
  | 'name'
  | 'title'
  | 'owner'
  | 'version'
  | 'banners'
  | 'iconUrl'
  | 'commands'
  | 'updatedAt'
  | 'sourceUrl'
  | 'categories'
  | 'description'
  | 'permissions'
  | 'relativePath'
  | 'downloadCount'
> & { baseAssetURL: string };

export type ExtensionUserListItem = ExtensionListItem &
  Pick<Extension, 'entry'>;

export type ExtensionUserDetail = ExtensionDetail &
  Pick<Extension, 'entry' | 'isPublished'>;
