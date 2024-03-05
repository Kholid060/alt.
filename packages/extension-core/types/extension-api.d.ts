import { ExtensionManifest } from '../dist/index';

declare namespace ExtensionAPI {
  export const manifest: ExtensionManifest;
}

declare namespace ExtensionAPI.clipboard {
  export type ClipboardContentType = 'html' | 'text' | 'image' | 'rtf';

  export function read(format: ClipboardContentType): Promise<string>;
  export function write(
    format: ClipboardContentType,
    value: string,
  ): Promise<void>;
}

declare namespace ExtensionAPI.installedApps {
  export interface AppDetail {
    name: string;
    appId: string;
    icon?: string;
    description?: string;
  }

  export function query(
    query:
      | `startsWith:${string}`
      | `endsWith:${string}`
      | `exact:${string}`
      | string
      | RegExp,
  ): Promise<Extension.InstalledAppDetail[]>;

  export function launch(appId: string): Promise<boolean>;

  // @ext-api-value
  export function getIconURL(appId: string): string;
}

export default ExtensionAPI;
