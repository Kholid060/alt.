interface Window {
  _extension: typeof _extension;
}

declare namespace _Extension {
  export interface InstalledAppDetail {
    name: string;
    appId: string;
    icon?: string;
    description?: string;
  }
}

declare namespace _extension {
  export const manifest: ExtensionManifest;
}

declare namespace _extension.tabs {
  export const hello: string;
}

declare namespace _extension.installedApps {
  export const query: (
    query: `startsWith:${string}` | `endsWith:${string}` | `exact:${string}` | string | RegExp
  ) => Promise<_Extension.InstalledAppDetail[]>;

  export const launch: (appId: string) => Promise<boolean>;
}

declare namespace _ExtView {
  
}

// export { _Extension };

// export default _extension;
