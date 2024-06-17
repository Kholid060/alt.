export interface ExtensionCommand {
  name: string;
  title: string;
  description: string;
}

export type ExtensionStatus = 'in-review' | 'rejected' | 'published';

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
  categories: string[];
  isPublished: boolean;
  rejectReason: string;
  downloadCount: number;
  status: ExtensionStatus;
  commands: ExtensionCommand[];
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
  | 'description'
>;

export type ExtensionListItem = Pick<
  Extension,
  | 'id'
  | 'title'
  | 'status'
  | 'iconUrl'
  | 'version'
  | 'createdAt'
  | 'updatedAt'
  | 'downloadCount'
>;

export type ExtensionUserListItem = ExtensionListItem &
  Pick<Extension, 'isPublished'>;
