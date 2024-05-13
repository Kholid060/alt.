/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ExtensionManifest } from '../src/client/manifest';
import type {
  USKeyboardKeys,
  KeyboardModifiersType,
  KeyboardKeyUpOptionsType,
  KeyboardKeyDownOptionsType,
  KeyboardBrowserTypeOptions,
  BrowserWaitForSelectorOptions,
  ExtensionBrowserElementSelector,
} from '@repo/shared';

type OmitFirstArg<F> = F extends (x: any, ...args: infer P) => infer R
  ? (...args: P) => R
  : never;

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

declare namespace ExtensionAPI.notifications {
  interface NotificationOptions {
    title: string;
    body?: string;
    silent?: boolean;
    subtitle?: string;
  }

  export function create(options: NotificationOptions): Promise<boolean>;
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

  export function showInFolder(appId: string): Promise<void>;

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

declare namespace ExtensionAPI.ui {
  interface ToastOptions {
    title: string;
    timeout?: number;
    description?: string;
    type?: 'loading' | 'error' | 'success';
  }
  interface Toast extends ToastOptions {
    hide(): void;
    show(options?: Partial<ToastOptions>): void;
  }

  // @ext-api-value
  export function createToast(options: ToastOptions): Toast;
}

declare namespace ExtensionAPI.ui.searchPanel {
  interface KeydownEvent {
    key: string;
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
  type GetTextOptions = BrowserGetTextOptions;
  type WaitForSelectorOptions = BrowserWaitForSelectorOptions;

  type KeyboardKeys = USKeyboardKeys;
  type KeyboardModifiers = KeyboardModifiersType;
  type KeyboardTypeOptions = KeyboardBrowserTypeOptions;

  type KeyUpOptions = KeyboardKeyUpOptionsType;
  type KeyDownOptions = KeyboardKeyDownOptionsType;
  type KeyPressOptions = KeyUpOptions & KeyDownOptions;

  type ElementSelector = ElementSelectorDetail | string;
  type ElementSelectorDetail = ExtensionBrowserElementSelector;

  interface ElementHandle {
    type: OmitFirstArg<typeof ExtensionAPI.browser.activeTab.type>;
    click: OmitFirstArg<typeof ExtensionAPI.browser.activeTab.click>;
    press: OmitFirstArg<typeof ExtensionAPI.browser.activeTab.press>;
    keyUp: OmitFirstArg<typeof ExtensionAPI.browser.activeTab.keyUp>;
    select: OmitFirstArg<typeof ExtensionAPI.browser.activeTab.select>;
    getText: OmitFirstArg<typeof ExtensionAPI.browser.activeTab.getText>;
    keyDown: OmitFirstArg<typeof ExtensionAPI.browser.activeTab.keyDown>;
    getText: OmitFirstArg<typeof ExtensionAPI.browser.activeTab.getText>;
    getAttributes: OmitFirstArg<
      typeof ExtensionAPI.browser.activeTab.getAttributes
    >;
  }
}

declare namespace ExtensionAPI.browser.activeTab {
  interface ActiveTab {
    url: string;
    title: string;
  }

  interface SelectElementFilter {
    selector?: string;
  }
  interface SelectElementOptions {
    title?: string;
    description?: string;
    filter?: SelectElementFilter;
  }

  export function selectElement(
    options?: SelectElementOptions,
  ): Promise<{ selector: string; canceled: boolean }>;

  export function get(): Promise<ActiveTab | null>;

  export function reload(): Promise<void>;

  export function click(
    selector: ExtensionAPI.browser.ElementSelector,
  ): Promise<void>;

  export function keyDown(
    selector: ExtensionAPI.browser.ElementSelector,
    key: ExtensionAPI.browser.KeyboardKeys,
    options?: ExtensionAPI.browser.KeyDownOptions,
  ): Promise<void>;

  export function keyUp(
    selector: ExtensionAPI.browser.ElementSelector,
    key: ExtensionAPI.browser.KeyboardKeys,
    options?: ExtensionAPI.browser.KeyUpOptions,
  ): Promise<void>;

  export function getText(
    selector?: ExtensionAPI.browser.ElementSelector,
    options?: Partial<ExtensionAPI.browser.GetTextOptions>,
  ): Promise<string>;

  export function getAttributes(
    selector: ExtensionAPI.browser.ElementSelector,
    attrNames: string,
  ): Promise<string | null>;
  export function getAttributes(
    selector: ExtensionAPI.browser.ElementSelector,
    attrNames?: string[],
  ): Promise<Record<string, string>>;
  export function getAttributes(
    selector: ExtensionAPI.browser.ElementSelector,
    attrNames?: string | string[],
  ): Promise<string | null | Record<string, string>>;

  export function type(
    selector: ExtensionAPI.browser.ElementSelector,
    text: string,
    options?: Partial<ExtensionAPI.browser.KeyboardTypeOptions>,
  ): Promise<void>;

  export function select(
    selector: ExtensionAPI.browser.ElementSelector,
    ...values: string[]
  ): Promise<string[]>;

  export function press(
    selector: ExtensionAPI.browser.ElementSelector,
    key: string,
    options?: ExtensionAPI.browser.KeyDownOptions &
      ExtensionAPI.browser.KeyUpOptions,
  ): Promise<void>;

  // @ext-api-value
  export function findElement(
    selector: string,
  ): Promise<ExtensionAPI.browser.ElementHandle | null>;

  // @ext-api-value
  export function findAllElements(
    selector: string,
  ): Promise<ExtensionAPI.browser.ElementHandle[]>;

  // @ext-api-value
  export function waitForSelector(
    selector: string,
    options?: ExtensionAPI.browser.WaitForSelectorOptions,
  ): Promise<ExtensionAPI.browser.ElementHandle | null>;
}

declare namespace ExtensionAPI.mainWindow {
  export function close(): Promise<void>;
}

export default ExtensionAPI;
