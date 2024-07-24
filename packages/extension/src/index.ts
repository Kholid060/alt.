import type { ExtensionManifest as ExtensionManifestType } from './extension-manifest';
import type { UiIcons } from '@altdot/ui';

export * from './extension-api/index';

export * from './constant/oauth.const';

export * from '@altdot/ui/dist/components/ui/list';
export * from '@altdot/ui/dist/components/ui/input';
export * from '@altdot/ui/dist/components/ui/image';
export * from '@altdot/ui/dist/components/ui/select';
export * from '@altdot/ui/dist/components/ui/switch';
export * from '@altdot/ui/dist/components/ui/textarea';
export * from '@altdot/ui/dist/components/ui/skeleton';
export * from './components/CommandRenderer';

export type * from './interfaces/message-events';
export type * from './interfaces/command.interface';
export type * from './interfaces/command-action.interface';
export type * from './interfaces/command-json-view.interface';

export { CommandLaunchBy } from './interfaces/command.interface';

// @ts-expect-error $UiExtIcon defined on the electron app
export const UiExtIcon: typeof UiIcons = self.$UiExtIcons;

export type ExtensionManifest = Omit<ExtensionManifestType, '$apiVersion'>;
