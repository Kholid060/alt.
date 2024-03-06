import { ExtensionManifest } from '@repo/extension-core/dist/index';
import ExtensionAPI from '@repo/extension-core/types/extension-api';

type Manifest = Omit<ExtensionManifest, '$apiVersion'>;

export { UiImage, UiList } from '@repo/ui';
export type {
  UiListGroupItem,
  UiListItem,
  UiListItems,
  UiListProps,
  UiListRef,
} from '@repo/ui';

export { ExtIcon as UiExtIcon } from './components/ext-icon';

export { default as commandRenderer } from './command-renderer/command-renderer';

export type * from './interfaces/message-events';
export type * from './interfaces/command.interface';

export type { Manifest, ExtensionAPI as Extension };
