import type { ExtensionManifest as ExtensionManifestType } from './extension-manifest';

export * from './extension-api/index';

export * from './components/components-map';

export type * from './interfaces/message-events';
export type * from './interfaces/command.interface';

export type * from './validation/command-json.validation';

export * from './const/extension.const';

export { CommandLaunchBy } from './interfaces/command.interface';

export type ExtensionManifest = Omit<ExtensionManifestType, '$apiVersion'>;
