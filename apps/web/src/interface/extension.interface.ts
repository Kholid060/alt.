import {
  EXTENSION_CATEGORIES,
  EXTENSION_PERMISSIONS,
  ExtensionCommandType,
} from '@alt-dot/extension-core';

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
  isPublished: boolean;
  downloadCount: number;
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
>;

export type ExtensionListItem = Pick<
  Extension,
  | 'id'
  | 'title'
  | 'iconUrl'
  | 'version'
  | 'createdAt'
  | 'updatedAt'
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
  >;

export type ExtensionUserListItem = ExtensionListItem &
  Pick<Extension, 'entry'>;

export type ExtensionUserDetail = ExtensionDetail &
  Pick<Extension, 'entry' | 'isPublished'>;
