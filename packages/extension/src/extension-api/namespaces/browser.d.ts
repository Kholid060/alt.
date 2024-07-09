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
  type GetHTMLOptions = BrowserGetHTMLOptions;
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
    type: OmitFirstArg<ActiveTab.Static['type']>;
    click: OmitFirstArg<ActiveTab.Static['click']>;
    press: OmitFirstArg<ActiveTab.Static['press']>;
    keyUp: OmitFirstArg<ActiveTab.Static['keyUp']>;
    select: OmitFirstArg<ActiveTab.Static['select']>;
    keyDown: OmitFirstArg<ActiveTab.Static['keyDown']>;
    getText: OmitFirstArg<ActiveTab.Static['getText']>;
    getHTML: OmitFirstArg<ActiveTab.Static['getHTML']>;
    mouseUp: OmitFirstArg<ActiveTab.Static['mouseUp']>;
    mouseDown: OmitFirstArg<ActiveTab.Static['mouseDown']>;
    selectFile: OmitFirstArg<ActiveTab.Static['selectFile']>;
    getAttributes: OmitFirstArg<ActiveTab.Static['getAttributes']>;
  }

  interface Static {
    activeTab: ActiveTab.Static;
  }
}

export declare namespace Browser.ActiveTab {
  interface ActiveTab {
    id: number;
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

  interface XYPoint {
    x: number;
    y: number;
  }

  type SelectFileDetail = BrowserSelectFileOptions;

  interface Static {
    selectElement(
      options?: SelectElementOptions,
    ): Promise<{ selector: string; canceled: boolean }>;

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
      files: (string | SelectFileDetail)[],
    ): Promise<void>;

    // @ext-api-value
    findElement(selector: string): Promise<ElementHandle | null>;

    // @ext-api-value
    findAllElements(selector: string): Promise<ElementHandle[]>;

    // @ext-api-value
    waitForSelector(
      selector: string,
      options?: WaitForSelectorOptions,
    ): Promise<ElementHandle | null>;

    // @ext-api-value
    get(): Promise<ActiveTab | null>;
  }
}
