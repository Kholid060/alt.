import type {
  USKeyboardKeys,
  BrowserGetHTMLOptions,
  BrowserSelectFileOptions,
  KeyboardBrowserTypeOptions,
  BrowserWaitForSelectorOptions,
  ExtensionBrowserElementSelector,
  KeyboardModifiers as KeyboardModifiersType,
  KeyboardKeyUpOptions as KeyboardKeyUpOptionsType,
  KeyboardKeyDownOptions as KeyboardKeyDownOptionsType,
  BrowserGetTextOptions,
  OmitFirstArg,
} from '@altdot/shared';

export declare namespace Browser {
  interface Static {
    tabs: Tabs.Static;

    isAvailable(): Promise<boolean>;
  }
}

export declare namespace Browser.Tabs {
  type GetHTMLOptions = BrowserGetHTMLOptions;
  type GetTextOptions = BrowserGetTextOptions;
  type WaitForSelectorOptions = BrowserWaitForSelectorOptions;

  type KeyboardKeys = USKeyboardKeys;
  type KeyboardModifiers = KeyboardModifiersType;
  type KeyboardTypeOptions = KeyboardBrowserTypeOptions;

  type KeyUpOptions = KeyboardKeyUpOptionsType;
  type KeyDownOptions = KeyboardKeyDownOptionsType;

  type ElementSelector = ExtensionBrowserElementSelector | string;

  interface ElementHandle {
    type: OmitFirstArg<Tabs.Tab['type']>;
    click: OmitFirstArg<Tabs.Tab['click']>;
    press: OmitFirstArg<Tabs.Tab['press']>;
    keyUp: OmitFirstArg<Tabs.Tab['keyUp']>;
    select: OmitFirstArg<Tabs.Tab['select']>;
    keyDown: OmitFirstArg<Tabs.Tab['keyDown']>;
    getText: OmitFirstArg<Tabs.Tab['getText']>;
    getHTML: OmitFirstArg<Tabs.Tab['getHTML']>;
    mouseUp: OmitFirstArg<Tabs.Tab['mouseUp']>;
    mouseDown: OmitFirstArg<Tabs.Tab['mouseDown']>;
    selectFile: OmitFirstArg<Tabs.Tab['selectFile']>;
    getAttributes: OmitFirstArg<Tabs.Tab['getAttributes']>;
    setAttributes: OmitFirstArg<Tabs.Tab['setAttributes']>;
  }

  type TabStatus = 'loading' | 'complete';

  interface TabDetail {
    id: number;
    url: string;
    title: string;
    active: boolean;
  }

  interface SelectElementFilter {
    selector?: string;
  }
  interface SelectElementOptions {
    title?: string;
    description?: string;
    filter?: SelectElementFilter;
  }

  type SelectFileOptions = BrowserSelectFileOptions;

  interface Tab {
    readonly id: number;
    readonly url: string;
    readonly title: string;
    readonly active: boolean;

    isClosed(): Promise<boolean>;

    selectElement(
      options?: SelectElementOptions,
    ): Promise<
      | { selector: string; el: null; canceled: true }
      | { selector: string; el: ElementHandle; canceled: false }
    >;

    reload(): Promise<void>;

    click(selector: ElementSelector): Promise<void>;

    mouseDown(selector: ElementSelector): Promise<void>;

    mouseUp(selector: ElementSelector): Promise<void>;

    keyDown(
      selector: ElementSelector,
      key: KeyboardKeys,
      options?: KeyDownOptions,
    ): Promise<void>;

    keyUp(
      selector: ElementSelector,
      key: KeyboardKeys,
      options?: KeyUpOptions,
    ): Promise<void>;

    getText(
      selector?: ElementSelector,
      options?: Partial<GetTextOptions>,
    ): Promise<string>;

    getHTML(
      selector?: ElementSelector,
      options?: Partial<GetHTMLOptions>,
    ): Promise<string>;

    setAttributes(
      selector: ElementSelector,
      attrs: Record<string, string>,
    ): Promise<void>;

    getAttributes(
      selector: ElementSelector,
      attrNames: string,
    ): Promise<string | null>;
    getAttributes(
      selector: ElementSelector,
      attrNames?: string[],
    ): Promise<Record<string, string>>;
    getAttributes(
      selector: ElementSelector,
      attrNames?: string | string[],
    ): Promise<string | null | Record<string, string>>;

    type(
      selector: ElementSelector,
      text: string,
      options?: Partial<KeyboardTypeOptions>,
    ): Promise<void>;

    select(selector: ElementSelector, ...values: string[]): Promise<string[]>;

    press(
      selector: ElementSelector,
      key: string,
      options?: KeyDownOptions & KeyUpOptions,
    ): Promise<void>;

    selectFile(
      selector: ElementSelector,
      files: (string | SelectFileOptions)[],
    ): Promise<void>;

    findElement(selector: string): Promise<ElementHandle | null>;

    findAllElements(selector: string): Promise<ElementHandle[]>;

    waitForSelector(
      selector: string,
      options?: WaitForSelectorOptions,
    ): Promise<ElementHandle | null>;

    getDetail(): Promise<TabDetail | null>;
  }

  interface QueryOptions {
    url?: string;
    index?: number;
    title?: string;
    active?: boolean;
    status?: TabStatus;
  }

  interface Static {
    // @ext-api-value
    query(options: QueryOptions): Promise<Tab[]>;

    // @ext-api-value
    getActive(): Promise<Tab | null>;
  }
}
