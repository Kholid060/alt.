import {
  ExtensionCategories,
  ExtensionCommandType,
  ExtensionPermissions,
} from '../utils/constant/extension.const';

export enum UserRole {
  User = 'user',
  Admin = 'admin',
}

export type APISuccessResult<T> =
  | { success: true; data: T }
  | { success: false; data?: null };

export interface ApiUserProfile {
  id: string;
  name: string;
  role: UserRole;
  createdAt: string;
  email: string | null;
  username: string | null;
  avatarUrl: string | null;
}

export interface ApiExtensionCommand {
  name: string;
  title: string;
  description?: string;
  type: ExtensionCommandType;
}

export type ApiExtensionStatus = 'in-review' | 'rejected' | 'published';

export interface ApiExtensionEntry {
  status: ApiExtensionStatus;
  rejectReason: string | null;
}

export type ApiExtensionOwner = Pick<
  ApiUserProfile,
  'avatarUrl' | 'name' | 'username'
>;

export interface ApiExtension {
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
  downloadUrl: string;
  description: string;
  relativePath: string;
  isPublished: boolean;
  downloadCount: number;
  owner: ApiExtensionOwner;
  entry: ApiExtensionEntry | null;
  commands: ApiExtensionCommand[];
  categories: ExtensionCategories[];
  permissions?: ExtensionPermissions[];
}

export type ApiExtensionCreatePayload = Pick<
  ApiExtension,
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

export type ApiExtensionListItem = Pick<
  ApiExtension,
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

export type ApiExtensionDetail = ApiExtensionListItem &
  Pick<
    ApiExtension,
    | 'banners'
    | 'commands'
    | 'sourceUrl'
    | 'categories'
    | 'permissions'
    | 'description'
    | 'relativePath'
  >;

export type ApiExtensionStoreListItem = ApiExtensionListItem &
  Pick<ApiExtension, 'commands'> & {
    owner: ApiExtensionOwner;
  };

export type ApiExtensionStoreDetail = Pick<
  ApiExtension,
  | 'id'
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
  | 'downloadUrl'
  | 'relativePath'
  | 'downloadCount'
> & { baseAssetURL: string };

export type ApiExtensionUserListItem = ApiExtensionListItem &
  Pick<ApiExtension, 'entry'>;

export type ApiExtensionUserDetail = ApiExtensionDetail &
  Pick<ApiExtension, 'entry' | 'isPublished'>;

export type ApiAdminExtensionListItem = ApiExtensionListItem &
  Pick<ApiExtension, 'isPublished' | 'sourceUrl' | 'relativePath'> & {
    entry:
      | (ApiExtensionEntry & { id: number; updateReason: string | null })
      | null;
    owner: ApiExtensionOwner & Pick<ApiUserProfile, 'id'>;
  };

export interface ApiStoreListExtensionsQuery {
  q?: string;
  nextCursor?: string;
  category?: ExtensionCategories;
  sortBy?: 'recently-added' | 'most-installed';
}

export type ApiAdminSetExtentionEntryPayload =
  | { type: 'rejected'; reason: string }
  | {
      type: 'approved';
      extension: Partial<ApiExtensionCreatePayload & { downloadUrl: string }>;
    };
