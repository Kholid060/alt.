import ExtensionAPI from '@altdot/extension-core/dist/extension-api';

declare global {
  const _extension: typeof ExtensionAPI;

  interface Window {
    _extension: typeof ExtensionAPI;
  }

  interface File {
    path: string;
  }
}
