import ExtensionAPI from '@repo/extension-core/types/extension-api';

declare global {
  const _extension: typeof ExtensionAPI;

  interface Window {
    _extension: typeof ExtensionAPI;
  }
}
