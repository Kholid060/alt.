import ExtensionAPI from '@alt-dot/extension-core/types/extension-api';

declare global {
  const _extension: typeof ExtensionAPI;

  interface Window {
    _extension: typeof ExtensionAPI;
  }

  interface File {
    path: string;
  }
}
