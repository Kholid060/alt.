---
title: browser
---

Interact with the browser. The extension must have the `browser` permission to use this API.

## Functions

### `browser.tabs.query`
> browser.tabs.query(options: [QueryOptions](#browsertabsqueryoptions)): Promise\<[Tab](#browsertabstab)[]>

Query all the browser tabs.

**Examples**

```js
// get all tabs
console.log(await _extension.browser.tabs.query({}));

// get active tabs
console.log(await _extension.browser.tabs.query({ active: true }));

// get all tab that has "mozilla.org" url
console.log(await _extension.browser.tabs.query({ url: '*://*.mozilla.org/*' }));
```

### `browser.tabs.getActive`
> browser.tabs.getActive(): Promise\<[Tab](#browsertabstab) \| null>

Get the active tab of the browser. The tab this method returns is the active tab when the command starts running. To get the last active tab of the browser, use the [`browser.tabs.query`](#browsertabsquery) instead.

## Types

### `browser.tabs.Tab`

Represents the browser tab

```ts
interface Tab {
    readonly id: number;
    readonly url: string;
    readonly title: string;
    readonly active: boolean;

    isClosed(): Promise<boolean>;

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
```

| Property | Description |
| ----------- | ----------- |
| `id` | `number` <br /> The tab id |
| `url` | `string` <br /> The tab URL |
| `title` | `string` <br /> The tab title |
| `active` | `boolean` <br /> Whether the tab is active or not |
| `isClosed` | `() => Promise<boolean>` <br /> Check if the tab is closed |
| `getDetail` | <code>() => Promise\<[TabDetail](#browsertabstabdetail)></code> <br /> Get the recent tab detail |
| `findElement` | <code>(selector: string) => Promise\<[ElementHandle](#browsertabselementhandle) \| null></code> <br /> Find the first element that matches the given selector. |
| `findAllElements` | <code>(selector: string) => Promise\<[ElementHandle](#browsertabselementhandle)[]></code> <br /> Find all  elements that matches the given selector. |
| `selectElement` | `(options?: SelectElementOptions) => Promise<{ selector: string; canceled: boolean }>` <br /> Let the user manually select an element in the browser tab |
| `reload` | `() => Promise<void>` <br /> Reload the tab |
| `click` | `() => Promise<void>` <br /> Click an element. |
| `mouseDown` | <code>(selector: [ElementSelector](#browsertabselementselector)) => Promise&lt;void></code> <br /> Presses the mouse to targeted element. |
| `mouseUp` | <code>(selector: [ElementSelector](#browsertabselementselector)) => Promise&lt;void></code> <br /> Release the mouse from the targeted element. |
| `keyDown` | <code>(selector: [ElementSelector](#browsertabselementselector), key: [KeyboardKeys](#browsertabskeyboardkeys), options?: [KeyDownOptions](#browsertabskeydownoptions)) => Promise&lt;void></code> <br /> Press key to the targeted element. |
| `keyUp` | <code>(selector: [ElementSelector](#browsertabselementselector), key: [KeyboardKeys](#browsertabskeyboardkeys), options?: [KeyUpOptions](#browsertabskeyupoptions)) => Promise&lt;void></code> <br /> Release from the targeted element. |
| `press` | <code>(selector: [ElementSelector](#browsertabselementselector), key: [KeyboardKeys](#browsertabskeyboardkeys), options?: [KeyUpOptions](#browsertabskeyupoptions) & [KeyDownOptions](#browsertabskeydownoptions)) => Promise&lt;void></code> <br /> Release from the targeted element. |
| `type` | <code>(selector: [ElementSelector](#browsertabselementselector), text: string, options?: [KeyboardTypeOptions](#browsertabskeyboardtypeoptions)) => Promise&lt;void></code> <br /> Type the text character by character to the targeted element. |
| `getText` | <code>(selector?: [ElementSelector](#browsertabselementselector), options?: [GetTextOptions](#browsertabsgettextoptions)) => Promise&lt;string></code> <br /> Get the element text, it will get the body text by default if the selector is not specified. |
| `getHtml` | <code>(selector?: [ElementSelector](#browsertabselementselector), options?: [GetHTMLOptions](#browsertabsgethtmloptions)) => Promise&lt;string></code> <br /> Get the element HTML, it will get the body HTML by default if the selector is not specified. |
| `setAttributes` | <code>(selector?: [ElementSelector](#browsertabselementselector), attrs: Record<string, string>) => Promise&lt;string></code> <br /> Set the element attribute. |
| `getAttributes` | <code>(selector?: [ElementSelector](#browsertabselementselector), attrNames?: string \| string[]) => Promise&lt;string \| null \| Record\<string, string>></code> <br /> Get the element attributes. |
| `select` | <code>(selector?: [ElementSelector](#browsertabselementselector), values: ...string[]) => Promise\<string[]></code> <br /> Select options in the [\<select>](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select) tag. If the select element has the `multiple` attribute, all the values will selected, otherwise it will only select the first value. |
| `selectFile` | <code>(selector?: [ElementSelector](#browsertabselementselector), files: (string \| [SelectFileOptions](#browsertabsselectfileoptions))[]) => Promise\<string[]></code> <br /> Set the files as the value of the [`<input type="file" />`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file) file element. The string in the `files` parameter must be file path. |
| `waitForSelector` | <code>(selector: [ElementSelector](#browsertabselementselector), options?: [WaitForSelectorOptions](#browsertabswaitforselectoroptions)) => Promise\<ElementHandle  \| null></code> <br /> Wait for an element until it matches the given state and selector |


:::caution
Be careful when using the tab method that has the [`ElementSelector`](#browsertabselementselector) parameter because it will throw an error if no element matches the selector.
:::

**Examples**
```js
const tab = await _extension.tabs.query({ active: true });

// Type "hello world"
await tab.type('input', 'Hello world');

// Select files
await tab.selectFile(
  'input[type="file"]',
  [
    'D:\\image.png',
    'D:\\document.txt',
    {
      mimeType: 'text/plain',
      fileName: 'hello-world.txt',
      lastModified: new Date().getTime(),
      contents: new TextEncoder().encode('Hello world!!'),
    }
  ]
);
```

### `browser.tabs.ElementHandle`

Represents element as in the browser tab

```ts
interface ElementHandle {
  type(
    text: string,
    options?: Partial<KeyboardTypeOptions>,
  ): Promise<void>;
  click(): Promise<void>;
  press(
    key: string,
    options?: KeyDownOptions & KeyUpOptions,
  ): Promise<void>;
  keyUp(
    key: KeyboardKeys,
    options?: KeyUpOptions,
  ): Promise<void>;
  select(...values: string[]): Promise<string[]>;
  keyDown(
    key: KeyboardKeys,
    options?: KeyDownOptions,
  ): Promise<void>;
  getText(options?: Partial<GetTextOptions>): Promise<string>;
  getHTML(options?: Partial<GetHTMLOptions>,): Promise<string>;
  mouseUp(): Promise<void>;
  mouseDown(): Promise<void>;
  selectFile(files: (string | SelectFileOptions)[]): Promise<void>;
  getAttributes(attrNames?: string | string[]): Promise<string | null | Record<string, string>>;
  setAttributes(attrs: Record<string, string>): Promise<void>;
}
```

The method in the element handle is pretty much the same as the one in the [browser tabs](#browsertabstab) type except the method that requires the `ElementSelector` parameter doesn't require it anymore..

### `browser.tabs.QueryOptions`

Options for the `browser.tabs.query` method.

```ts
interface QueryOptions {
  url?: string;
  index?: number;
  title?: string;
  active?: boolean;
  status?: TabStatus;
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `url` | `?string` | Match the tab url againts [match patterns](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns)  |
| `index` | `?number` | The tab position within their window |
| `title` | `?string` | Match the tab againts the tab title |
| `active` | `?boolean` | Whether the tab is active or not |
| `status` | [`?TabStatus`](#browsertabstabstatus) | The status of the tab |


### `browser.tabs.GetHTMLOptions`

Options for the `getHTML` tab method.

```ts
interface GetHTMLOptions {
  outerHTML: boolean;
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `outerHTML` | `boolean` | Capture the HTML of the element itself and its content  |

### `browser.tabs.GetTextOptions`

Options for the `getText` tab method.

```ts
interface BrowserGetTextOptions {
  onlyVisibleText: boolean;
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `onlyVisibleText` | `boolean` | Only capture text that are visible  |

### `browser.tabs.KeyboardKeys`

Keyboard keys

```ts
type KeyboardKeys = string;

```
### `browser.tabs.KeyboardModifiers`

Keyboard modifiers

```ts
type KeyboardModifiers = 'ctrl' | 'shift' | 'alt' | 'meta' | 'cmd';

```
### `browser.tabs.KeyboardTypeOptions`

Options for the `type` tab method.

```ts
interface KeyboardTypeOptions {
  delay: number;
  clearValue: boolean;
}
```
| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `delay` | `number` | Delay in milliseconds when typing each key |
| `clearValue` | `boolean` | Clear value of the targeted text field |

### `browser.tabs.KeyDownOptions`

Options for the `type` tab method.

```ts
interface KeyDownOptions {
  text?: string;
  modifiers?: KeyboardModifiers[];
}
```
| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `text` | `number` | Text to send when pressing key |
| `modifiers` | [`KeyboardModifiers[]`](#browsertabskeyboardmodifiers) | Keyboard modifiers |

### `browser.tabs.KeyUpOptions`

Options for the `type` tab method.

```ts
interface KeyUpOptions {
  delay?: number;
  modifiers?: KeyboardModifiers[];
}
```
| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `delay` | `number` | Delay in milliseconds before releasing key |
| `modifiers` | [`KeyboardModifiers[]`](#browsertabskeyboardmodifiers) | Keyboard modifiers |

### `browser.tabs.ElementSelector`

Selector to query element inside the tab.

```ts
type ElementSelector = {
  selector: string;
  elementIndex?: number;
} | string;
```
| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `selector` | `string` | Element selector |
| `elementIndex` | `?number` | Index of the element to select |

Inside the selector string, you can use either [CSS Selector](https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Selectors) or [XPath](https://developer.mozilla.org/en-US/docs/Web/XPath). You can write CSS Selector directly but for using the XPath you must use the `::xpath=` prefix.

Alt. app has a custom CSS Selector syntax that you can use:

- `>>`: Selecting an element inside a [shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM). For example, `.element-a >> .element-b`

**Examples**

```js
const tab = await _extension.tabs.query({ active: true });

// Using CSS Selector
tab.click('button');

// Click the second button that matches the selector
tab.click({ selector: 'button', elementIndex: 1 });

// Using XPath
tab.click('::xpath=//button');

// Clicking a button inside a shadow dom
tab.click('.shadowm-dom >> button');
```

### `browser.tabs.TabStatus`

The browser tab's loading status

```ts
type TabStatus = 'loading' | 'complete';
```

### `browser.tabs.SelectFileOptions`

File to select in the HTML [`<input type="file" />`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file) element

```ts
interface SelectFileOptions {
  fileName: string;
  mimeType: string;
  lastModified: number;
  contents: ArrayBuffer;
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `fileName` | `string` | Name of the file. It should include the file extension |
| `mimeType` | `string` | [MIME type](https://en.wikipedia.org/wiki/Media_type) of the file |
| `lastModified` | `number` | Last time the file is modified. The value must be in [unix time](https://en.wikipedia.org/wiki/Unix_time) |

### `browser.tabs.TabDetail`

Contains information about the browser tab

```ts
interface TabDetail {
  id: number;
  url: string;
  title: string;
  active: boolean;
}
```

### `browser.tabs.WaitForSelectorOptions`

Options for the `waitForSelector` tab method.

```ts
interface WaitForSelectorOptions {
  timeout?: number;
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
}
```
| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `timeout` | `?number` | How long it should be waiting in milliseconds. Default is 5000 |
| `state` | `'attached' \| 'detached' \| 'visible' \| 'hidden'` | The state of the element. Default is `visible` |

Element state:
- `attached`: Element is available in the DOM tree.
- `detached`: Element is detched from the DOM tree.
- `visible`: Element is considered visible when:
  - The element size (height and width) is not zero
  - The element doesn't have `visibility: hidden` computed style
  - The element doesn't have `display: none` computed style
- `hidden`: The opposite of the `visible` state