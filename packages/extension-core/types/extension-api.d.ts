import { ExtensionManifest } from '../dist/index';

declare namespace ExtensionAPI {
  export const manifest: ExtensionManifest;
}

declare namespace ExtensionAPI.tabs {
  export const hello: string;
}

declare namespace ExtensionAPI.installedApps {
  export interface AppDetail {
    name: string;
    appId: string;
    icon?: string;
    description?: string;
  }

  export const query: (
    query:
      | `startsWith:${string}`
      | `endsWith:${string}`
      | `exact:${string}`
      | string
      | RegExp,
  ) => Promise<Extension.InstalledAppDetail[]>;

  export const launch: (appId: string) => Promise<boolean>;
}

export default ExtensionAPI;
