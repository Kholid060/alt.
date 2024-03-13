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

declare namespace ExtensionAPI.fs {
  interface WriteOptions {
    encoding: string;
    stringType: 'base64';
  }
  interface ReadOptions {
    encoding: string;
  }
  export function readFile(
    path: string,
    options?: Partial<ReadOptions>,
  ): Promise<Uint8Array | string>;

  export function writeFile(
    path: string,
    data: string | Uint8Array,
    options?: Partial<WriteOptions>,
  ): Promise<void>;

  export function appendFile(
    path: string,
    data: string | Uint8Array,
    options?: Partial<WriteOptions>,
  ): Promise<void>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function readJSON(path: string): Promise<Record<any, any>>;

  export function exists(path: string): Promise<boolean>;
}

export default ExtensionAPI;
