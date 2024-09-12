import { ExtensionAPI } from '@altdot/extension';
import { IPCUserExtensionEventsMap } from '../../interface/ipc-events.interface';
import { CreateExtensionAPI } from './extension-api-factory';
import { ExtensionBrowserElementSelector } from '@altdot/shared';

const getElementSelector = (
  selector:
    | ExtensionAPI.Browser.Tabs.ElementSelector
    | ExtensionBrowserElementSelector,
): ExtensionBrowserElementSelector =>
  typeof selector === 'string' ? { selector } : selector;

type TabDetail = ExtensionAPI.Browser.Tabs.TabDetail & { browserId: string };
export class ExtensionBrowserTab implements ExtensionAPI.Browser.Tabs.Tab {
  #tabDetail: TabDetail;

  readonly #sendMessage: CreateExtensionAPI['sendMessage'];
  readonly #sendAction: IPCUserExtensionEventsMap['browser.tabs.#actions'];

  constructor(
    detail: TabDetail,
    sendMessage: CreateExtensionAPI['sendMessage'],
  ) {
    this.#tabDetail = detail;
    this.#sendMessage = sendMessage;
    // @ts-expect-error wrapper
    this.#sendAction = (detail) => {
      return sendMessage('browser.tabs.#actions', detail);
    };
  }

  get id() {
    return this.#tabDetail.id;
  }

  get url() {
    return this.#tabDetail.url;
  }

  get title() {
    return this.#tabDetail.title;
  }

  get active() {
    return this.#tabDetail.active;
  }

  isClosed(): Promise<boolean> {
    return this.#sendAction({
      name: 'tabs:is-closed',
      args: [{ tabId: this.id }],
      browserId: this.#tabDetail.browserId,
    });
  }

  async selectElement(
    options?: ExtensionAPI.Browser.Tabs.SelectElementOptions,
  ): ReturnType<ExtensionAPI.Browser.Tabs.Tab['selectElement']> {
    const result = await this.#sendAction({
      name: 'tabs:select-element',
      browserId: this.#tabDetail.browserId,
      timeout: 10 * 60 * 1000, // 10 minutes
      args: [{ tabId: this.id }, options ?? {}],
    });

    return result.canceled
      ? { canceled: true, el: null, selector: '' }
      : {
          canceled: false,
          el: this.#createElementHandle({ selector: result.selector }),
          selector: result.selector,
        };
  }

  reload(): Promise<void> {
    return this.#sendAction({
      name: 'tabs:reload',
      args: [{ tabId: this.id }],
      browserId: this.#tabDetail.browserId,
    });
  }

  click(selector: ExtensionAPI.Browser.Tabs.ElementSelector): Promise<void> {
    return this.#sendAction({
      name: 'tabs:click',
      browserId: this.#tabDetail.browserId,
      args: [{ tabId: this.id }, getElementSelector(selector)],
    });
  }

  mouseDown(
    selector: ExtensionAPI.Browser.Tabs.ElementSelector,
  ): Promise<void> {
    return this.#sendAction({
      name: 'tabs:mouse-down',
      browserId: this.#tabDetail.browserId,
      args: [{ tabId: this.id }, getElementSelector(selector)],
    });
  }

  mouseUp(selector: ExtensionAPI.Browser.Tabs.ElementSelector): Promise<void> {
    return this.#sendAction({
      name: 'tabs:mouse-up',
      browserId: this.#tabDetail.browserId,
      args: [{ tabId: this.id }, getElementSelector(selector)],
    });
  }

  keyDown(
    selector: ExtensionAPI.Browser.Tabs.ElementSelector,
    key: ExtensionAPI.Browser.Tabs.KeyboardKeys,
    options?: ExtensionAPI.Browser.Tabs.KeyDownOptions,
  ): Promise<void> {
    return this.#sendAction({
      name: 'tabs:key-down',
      browserId: this.#tabDetail.browserId,
      args: [
        { tabId: this.id },
        getElementSelector(selector),
        key,
        options ?? {},
      ],
    });
  }

  keyUp(
    selector: ExtensionAPI.Browser.Tabs.ElementSelector,
    key: ExtensionAPI.Browser.Tabs.KeyboardKeys,
    options: ExtensionAPI.Browser.Tabs.KeyUpOptions = {},
  ): Promise<void> {
    return this.#sendAction({
      name: 'tabs:key-up',
      browserId: this.#tabDetail.browserId,
      args: [{ tabId: this.id }, getElementSelector(selector), key, options],
    });
  }

  getText(
    selector: ExtensionAPI.Browser.Tabs.ElementSelector = 'html',
    options: Partial<ExtensionAPI.Browser.Tabs.GetTextOptions> = {},
  ): Promise<string> {
    return this.#sendAction({
      name: 'tabs:get-text',
      browserId: this.#tabDetail.browserId,
      args: [{ tabId: this.id }, getElementSelector(selector), options],
    });
  }

  getHTML(
    selector: ExtensionAPI.Browser.Tabs.ElementSelector = 'html',
    options: Partial<ExtensionAPI.Browser.Tabs.GetHTMLOptions> = {},
  ): Promise<string> {
    return this.#sendAction({
      name: 'tabs:get-html',
      browserId: this.#tabDetail.browserId,
      args: [{ tabId: this.id }, getElementSelector(selector), options],
    });
  }

  setAttributes(
    selector: ExtensionAPI.Browser.Tabs.ElementSelector,
    attrs: Record<string, string>,
  ): Promise<void> {
    return this.#sendAction({
      name: 'tabs:set-attributes',
      browserId: this.#tabDetail.browserId,
      args: [{ tabId: this.id }, getElementSelector(selector), attrs],
    });
  }

  getAttributes(
    selector: ExtensionAPI.Browser.Tabs.ElementSelector,
    attrNames: string,
  ): Promise<string | null>;
  getAttributes(
    selector: ExtensionAPI.Browser.Tabs.ElementSelector,
    attrNames?: string[],
  ): Promise<Record<string, string>>;
  getAttributes(
    selector: ExtensionAPI.Browser.Tabs.ElementSelector,
    attrNames?: string | string[],
  ): Promise<string | null | Record<string, string>>;
  getAttributes(
    selector: ExtensionAPI.Browser.Tabs.ElementSelector,
    attrNames?: string | string[],
  ): Promise<unknown> {
    return this.#sendAction({
      name: 'tabs:get-attributes',
      browserId: this.#tabDetail.browserId,
      args: [
        { tabId: this.id },
        getElementSelector(selector),
        attrNames ?? null,
      ],
    });
  }

  type(
    selector: ExtensionAPI.Browser.Tabs.ElementSelector,
    text: string,
    options: Partial<ExtensionAPI.Browser.Tabs.KeyboardTypeOptions> = {},
  ): Promise<void> {
    return this.#sendAction({
      name: 'tabs:type',
      browserId: this.#tabDetail.browserId,
      args: [{ tabId: this.id }, getElementSelector(selector), text, options],
    });
  }

  select(
    selector: ExtensionAPI.Browser.Tabs.ElementSelector,
    ...values: string[]
  ): Promise<string[]> {
    return this.#sendAction({
      name: 'tabs:select',
      browserId: this.#tabDetail.browserId,
      args: [{ tabId: this.id }, getElementSelector(selector), values],
    });
  }

  press(
    selector: ExtensionAPI.Browser.Tabs.ElementSelector,
    key: string,
    options: ExtensionAPI.Browser.Tabs.KeyDownOptions &
      ExtensionAPI.Browser.Tabs.KeyUpOptions = {},
  ): Promise<void> {
    return this.#sendAction({
      name: 'tabs:press',
      browserId: this.#tabDetail.browserId,
      args: [{ tabId: this.id }, getElementSelector(selector), key, options],
    });
  }

  selectFile(
    selector: ExtensionAPI.Browser.Tabs.ElementSelector,
    files: (string | ExtensionAPI.Browser.Tabs.SelectFileData)[],
    options: ExtensionAPI.Browser.Tabs.SelectFileOptions = {},
  ): Promise<void> {
    return this.#sendMessage('browser.tabs.selectFiles', {
      files,
      options,
      tab: { tabId: this.id },
      browserId: this.#tabDetail.browserId,
      selector: getElementSelector(selector),
    });
  }

  #createElementHandle(
    selector: ExtensionBrowserElementSelector,
  ): ExtensionAPI.Browser.Tabs.ElementHandle {
    return {
      type: this.type.bind(this, selector),
      click: this.click.bind(this, selector),
      keyUp: this.keyUp.bind(this, selector),
      press: this.press.bind(this, selector),
      select: this.select.bind(this, selector),
      getHTML: this.getHTML.bind(this, selector),
      getText: this.getText.bind(this, selector),
      keyDown: this.keyDown.bind(this, selector),
      mouseUp: this.mouseUp.bind(this, selector),
      mouseDown: this.mouseDown.bind(this, selector),
      selectFile: this.selectFile.bind(this, selector),
      getAttributes: this.getAttributes.bind(this, selector),
      setAttributes: this.setAttributes.bind(this, selector),
      findAllElements: (childSelector) =>
        this.#_findAllElements({
          selector: childSelector,
          parentSelector: selector.selector,
          parentSelectorIndex: selector.elementIndex,
        }),
      findElement: (childSelector) =>
        this.#_findElement({
          selector: childSelector,
          parentSelector: selector.selector,
          parentSelectorIndex: selector.elementIndex,
        }),
    };
  }

  async #_findElement(
    selector: ExtensionBrowserElementSelector,
  ): Promise<ExtensionAPI.Browser.Tabs.ElementHandle | null> {
    const elementExists = await this.#sendAction({
      browserId: this.#tabDetail.browserId,
      name: 'tabs:element-exists',
      args: [{ tabId: this.id }, selector, false],
    });
    if (!elementExists) return null;

    return this.#createElementHandle(selector);
  }

  async #_findAllElements(
    selector: ExtensionBrowserElementSelector,
  ): Promise<ExtensionAPI.Browser.Tabs.ElementHandle[]> {
    const elementExists = await this.#sendAction({
      browserId: this.#tabDetail.browserId,
      name: 'tabs:element-exists',
      args: [{ tabId: this.id }, getElementSelector(selector), true],
    });

    return (elementExists as number[]).map((index) =>
      this.#createElementHandle({ ...selector, elementIndex: index }),
    );
  }

  async findElement(
    selector: string,
  ): Promise<ExtensionAPI.Browser.Tabs.ElementHandle | null> {
    return this.#_findElement(getElementSelector(selector));
  }

  async findAllElements(
    selector: string,
  ): Promise<ExtensionAPI.Browser.Tabs.ElementHandle[]> {
    return this.#_findAllElements(getElementSelector(selector));
  }

  async waitForSelector(
    selector: string,
    options: ExtensionAPI.Browser.Tabs.WaitForSelectorOptions = {},
  ): Promise<ExtensionAPI.Browser.Tabs.ElementHandle | null> {
    await this.#sendAction({
      name: 'tabs:wait-for-selector',
      browserId: this.#tabDetail.browserId,
      args: [{ tabId: this.id }, getElementSelector(selector), options],
    });

    return this.#createElementHandle({ selector });
  }

  async getDetail(): Promise<ExtensionAPI.Browser.Tabs.TabDetail | null> {
    const result = await this.#sendAction({
      name: 'tabs:get-detail',
      args: [{ tabId: this.id }],
      browserId: this.#tabDetail.browserId,
    });

    if (result) {
      this.#tabDetail = {
        ...this.#tabDetail,
        ...result,
      };
    }

    return result;
  }
}
