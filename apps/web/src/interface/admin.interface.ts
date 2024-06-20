import {
  Extension,
  ExtensionEntry,
  ExtensionListItem,
  ExtensionOwner,
} from './extension.interface';
import { UserProfile } from './user.interface';

export type AdminExtensionListItem = ExtensionListItem &
  Pick<Extension, 'isPublished' | 'sourceUrl' | 'relativePath'> & {
    entry:
      | (ExtensionEntry & { id: number; updateReason: string | null })
      | null;
    owner: ExtensionOwner & Pick<UserProfile, 'id'>;
  };
