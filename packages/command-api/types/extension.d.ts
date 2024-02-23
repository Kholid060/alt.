interface Window {
  _extension: typeof _extension;
}

declare namespace _extension {
  export const manifest: ExtensionManifest;
}

declare namespace _extension.tabs {
  export const hello: string;
}

declare namespace _ExtView {
  
}