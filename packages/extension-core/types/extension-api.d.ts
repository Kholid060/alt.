/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExtensionManifest } from '../src/client/manifest';
import { KeyboardBrowserTypeOptions } from '@repo/shared';

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

  export function paste(value: any): Promise<void>;
}

declare namespace ExtensionAPI.shell {
  export function moveToTrash(path: string | string[]): Promise<void>;

  export function showItemInFolder(path: string): Promise<void>;

  export function openURL(url: string): Promise<void>;
}

declare namespace ExtensionAPI.runtime {}

declare namespace ExtensionAPI.runtime.config {
  export function getValues<T extends object = Record<string, unknown>>(
    type?: 'extension' | 'command',
  ): Promise<T>;
}

declare namespace ExtensionAPI.shell.installedApps {
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

declare namespace ExtensionAPI.sqlite {
  interface QueryOptions {
    selectAll: boolean;
  }

  export function query<T = any>(
    sqlQuery: string,
    params?: unknown[],
    options?: Partial<QueryOptions>,
  ): Promise<T>;
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

  export function readJSON(path: string): Promise<Record<any, any>>;

  export function exists(path: string): Promise<boolean>;
}

declare namespace ExtensionAPI.storage {
  type Values =
    | string
    | boolean
    | number
    | null
    | Record<string | number, any>
    | Array<any>;

  export function get(key: string | string[]): Promise<Record<string, Values>>;

  export function getAll(): Promise<Record<string, Values>>;

  export function set(key: string, value: Values): Promise<void>;

  export function remove(key: string | string[]): Promise<void>;

  export function clear(): Promise<void>;
}

declare namespace ExtensionAPI.ui.searchPanel {
  interface KeydownEvent {
    key: boolean;
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
  }

  export const onChanged: {
    removeListener(callback: () => void): void;
    addListener(callback: (value: string) => void): void;
  };
  export const onKeydown: {
    removeListener(callback: () => void): void;
    addListener(callback: (event: KeydownEvent) => void): void;
  };
}

declare namespace ExtensionAPI.browser {
  type KeyboardTypeOptions = KeyboardBrowserTypeOptions;
}

declare namespace ExtensionAPI.browser.activeTab {
  interface ActiveTab {
    url: string;
    title: string;
  }

  export function get(): Promise<ActiveTab | null>;

  export function reload(): Promise<void>;

  export function click(selector: string): Promise<void>;

  export function type(
    selector: string,
    text: string,
    options?: Partial<ExtensionAPI.browser.KeyboardTypeOptions>,
  ): Promise<void>;
}

export default ExtensionAPI;
