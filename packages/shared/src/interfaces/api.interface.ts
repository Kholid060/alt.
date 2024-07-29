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
  website: string | null;
  username: string | null;
  avatarUrl: string | null;
  githubHandle: string | null;
}

export type ApiUserData = Pick<
  ApiUserProfile,
  'name' | 'website' | 'avatarUrl' | 'username' | 'createdAt' | 'githubHandle'
>;

export interface ApiExtensionCommand {
  name: string;
  title: string;
  description?: string;
  isInternal?: boolean;
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

export type ApiExtensionUserListItem = Omit<ApiExtensionListItem, 'owner'> &
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

export type ApiExtensionHighlightItem = Pick<
  ApiExtension,
  'id' | 'name' | 'title' | 'iconUrl' | 'description' | 'owner'
>;

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

export interface ApiWorkflowNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
  position: {
    x: number;
    y: number;
  };
}
export interface ApiWorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}
export interface ApiWorkflowViewport {
  x: number;
  y: number;
  zoom: number;
}
export interface ApiWorkflowVariable {
  id: string;
  name: string;
  value: string;
}
export interface ApiWorkflowData {
  edges: ApiWorkflowEdge[];
  nodes: ApiWorkflowNode[];
  viewport?: ApiWorkflowViewport;
  variables: ApiWorkflowVariable[];
}
export interface ApiWorkflow {
  id: string;
  name: string;
  icon: string;
  readme: string;
  createdAt: string;
  updatedAt: string;
  downloadCount: number;
  owner: ApiExtensionOwner;
  workflow: ApiWorkflowData;
  description?: string | null;
  categories: ExtensionCategories[];
}
export type ApiWorkflowUserInsertPayload = Pick<
  ApiWorkflow,
  'name' | 'description' | 'workflow' | 'categories' | 'icon' | 'readme'
>;

export type ApiWorkflowUserUpdatePayload =
  Partial<ApiWorkflowUserInsertPayload>;
export type ApiWorkflowListItem = Pick<
  ApiWorkflow,
  | 'id'
  | 'icon'
  | 'name'
  | 'owner'
  | 'createdAt'
  | 'updatedAt'
  | 'description'
  | 'downloadCount'
>;
export type ApiWorkflowUserListItem = ApiWorkflowListItem;
export type ApiWorkflowDetail = Pick<
  ApiWorkflow,
  | 'id'
  | 'name'
  | 'icon'
  | 'owner'
  | 'readme'
  | 'workflow'
  | 'createdAt'
  | 'updatedAt'
  | 'categories'
  | 'description'
  | 'downloadCount'
>;

export type ApiWorkflowStoreListItem = ApiWorkflowListItem;
