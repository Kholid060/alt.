import type { ExtensionManifest as ExtensionManifestType } from './extension-manifest';
import type { UiIcons } from '@altdot/ui';

export { UiList } from '@altdot/ui/dist/components/ui/list';
export { UiInput } from '@altdot/ui/dist/components/ui/input';
export { UiImage } from '@altdot/ui/dist/components/ui/image';
export { UiSelect } from '@altdot/ui/dist/components/ui/select';
export { UiSwitch } from '@altdot/ui/dist/components/ui/switch';
export { UiTextarea } from '@altdot/ui/dist/components/ui/textarea';
export { UiSkeleton } from '@altdot/ui/dist/components/ui/skeleton';
export type { UiListItem, UiListProps, UiListRef } from '@altdot/ui';

export { default as commandRenderer } from './components/command-renderer/command-renderer';
export type {
  ExtensionCommandRenderer,
  ExtensionCommandView,
} from './components/command-renderer/command-renderer';

export * from './extension-api/index';

export * from './constant/oauth.const';

export type * from './interfaces/message-events';
export type * from './interfaces/command.interface';
export type * from './interfaces/command-action.interface';
export type * from './interfaces/command-json-view.interface';

export { CommandLaunchBy } from './interfaces/command.interface';

// @ts-expect-error $UiExtIcon defined on the electron app
export const UiExtIcon: typeof UiIcons = self.$UiExtIcons;

export type ExtensionManifest = Omit<ExtensionManifestType, '$apiVersion'>;
