import { ExtensionManifest } from '@repo/extension-core/dist/index';
import ExtensionAPI from '@repo/extension-core/types/extension-api';

type Manifest = Omit<ExtensionManifest, '$apiVersion'>;

export { UiImage as ExtImage } from '@repo/ui';

export { ExtIcon } from './components/ext-icon';
export type { ExtCommandItemProps } from './components/command-list';
export {
  ExtCommandList,
  ExtCommandListItem,
  ExtCommandListIcon,
} from './components/command-list';

export { default as commandRenderer } from './command-renderer/command-renderer';

export type * from './interfaces/message-events';

export type { Manifest, ExtensionAPI as Extension };
