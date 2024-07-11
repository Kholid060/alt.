import type { UiIcons } from '@altdot/ui';

export type { ExtensionManifest } from './extension-manifest';

export { UiImage, UiList, UiInput, UiSelect, UiSwitch } from '@altdot/ui';
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

// @ts-expect-error $UiExtIcon defined on app
export const UiExtIcon: typeof UiIcons = self.$UiExtIcons;
