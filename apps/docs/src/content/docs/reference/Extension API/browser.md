---
title: browser
---

Interact with the browser.

## Functions

### `browser.isAvailable`
> browser.tabs.query(): Promise\<boolean>


Check if there's a browser that can be used.

**Example**

```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const isBrowserAvailable = await _extension.browser.isAvailable();
  if (!isBrowserAvailable) {
    throw new Error('Make sure to open a browser or the Alt. browser extension is installed');
  }
}
```

### `browser.tabs.query`
> browser.tabs.query(options: [QueryOptions](#browsertabsqueryoptions)): Promise\<[Tab](#browsertabstab)[]>

Query all the browser tabs.

**Example**

```js
import { _extension } from '@altdot/extension';

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


## Classes

### `browser.tabs.Tab`

Represents the browser tab.

:::caution
Be careful when using the tab method that has the [`ElementSelector`](#browsertabselementselector) parameter because it will throw an error if no element matches the selector.
:::

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
    files: (string | SelectFileData)[],
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

#### `browser.tabs.Tab.id`
> number

The tab id

#### `browser.tabs.Tab.url`
> string

The tab URL

#### `browser.tabs.Tab.title`
> string

The tab title

#### `browser.tabs.Tab.active`
> boolean

Whether the tab is active or not

#### `browser.tabs.Tab.isClosed`
> () =&gt; Promise&lt;boolean&gt;

Check if the tab is closed

#### `browser.tabs.Tab.getDetail`
> () =&gt; Promise&lt;<a href="#browsertabstabdetail">TabDetail</a>&gt;

Get the latest tab detail. Because the `url`, `title`, and `active` properties is not changed when the tab is updated on the actual browser, use this method to get the latest tab detail.  

**Example**

```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const activeTab = await _extension.browser.tabs.getActive();
  if (!activeTab) return;

  const tabDetail = await activeTab.getDetail();
  console.log('active:', tabDetail.active);
  console.log('title:', tabDetail.title);
  console.log('url:', tabDetail.url);
}
```

#### `browser.tabs.Tab.findElement`
> (selector: string) =&gt; Promise&lt;<a href="#browsertabselementhandle" style="">ElementHandle</a> | null&gt;

Find the first element that matches the given selector.

**Example**

```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const activeTab = await _extension.browser.tabs.getActive();
  if (!activeTab) return;

  const buttonEl = await activeTab.findElement('button');
  if (!buttonEl) throw new Error('Button element not found');
  
  await buttonEl.click();
}
```

#### `browser.tabs.Tab.findAllElements`
> (selector: string) =&gt; Promise&lt;<a href="#browsertabselementhandle">ElementHandle</a>[]&gt;

Find all elements that matches the given selector.

**Example**

```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const activeTab = await _extension.browser.tabs.getActive();
  if (!activeTab) return;

  const elements = await activeTab.findAllElements('h1');
  const text = await Promise.all(elements.map((el) => el.getText()));

  console.log(text);
}
```

#### `browser.tabs.Tab.selectElement`
> (options?: SelectElementOptions) =&gt; Promise&lt;{ selector: string; canceled: boolean }&gt;

Let the user manually select an element in the browser tab

**Example**

```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const activeTab = await _extension.browser.tabs.getActive();
  if (!activeTab) return;

  const selectedEl = await activeTab.selectElement({
    title: 'Select a table',
    filter: {
      selector: 'table'
    }
  });
  if (selectedEl.canceled) return;
  
  const tableHeaderText = await activeTab.getText(`${selectedEl.selector} th`);
  console.log(tableHeaderText);
}
```

#### `browser.tabs.Tab.reload`
> () =&gt; Promise&lt;void&gt;

Reload the tab.

#### `browser.tabs.Tab.click`
> () =&gt; Promise&lt;void&gt;

Click an element.

**Example**

```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const activeTab = await _extension.browser.tabs.getActive();
  if (!activeTab) return;
  
  await activeTab.click('a');
}
```

#### `browser.tabs.Tab.mouseDown`
> (selector: <a href="#browsertabselementselector">ElementSelector</a>) =&gt; Promise&lt;void&gt;

Presses the mouse to targeted element.

#### `browser.tabs.Tab.mouseUp`
> (selector: <a href="#browsertabselementselector">ElementSelector</a>) =&gt; Promise&lt;void&gt;

Release the mouse from the targeted element.

#### `browser.tabs.Tab.keyDown`
> (selector: <a href="#browsertabselementselector">ElementSelector</a>, key: <a href="#browsertabskeyboardkeys">KeyboardKeys</a>, options?: <a href="#browsertabskeydownoptions">KeyDownOptions</a>) =&gt; Promise&lt;void&gt;

Press key to the targeted element.

#### `browser.tabs.Tab.keyUp`
> (selector: <a href="#browsertabselementselector">ElementSelector</a>, key: <a href="#browsertabskeyboardkeys">KeyboardKeys</a>, options?: <a href="#browsertabskeyupoptions">KeyUpOptions</a>) =&gt; Promise&lt;void&gt;

Release the key from the targeted element.

#### `browser.tabs.Tab.press`
> (selector: <a href="#browsertabselementselector">ElementSelector</a>, key: <a href="#browsertabskeyboardkeys">KeyboardKeys</a>, options?: <a href="#browsertabskeyupoptions">KeyUpOptions</a> &amp; <a href="#browsertabskeydownoptions">KeyDownOptions</a>) =&gt; Promise&lt;void&gt;

Press and release key to the targeted element.

**Example**

```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const activeTab = await _extension.browser.tabs.getActive();
  if (!activeTab) return;
  
  await textField.press('input', 'Enter');
}
```

#### `browser.tabs.Tab.type`
> (selector: <a href="#browsertabselementselector">ElementSelector</a>, text: string, options?: <a href="#browsertabskeyboardtypeoptions">KeyboardTypeOptions</a>) =&gt; Promise&lt;void&gt;

Type the text character by character to the targeted element.

**Example**

```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const activeTab = await _extension.browser.tabs.getActive();
  if (!activeTab) return;
  
  await textField.type('input', 'Hello world!!', { delay: 100, clearValue: true });
}
```

#### `browser.tabs.Tab.getText`
> (selector?: <a href="#browsertabselementselector">ElementSelector</a>, options?: <a href="#browsertabsgettextoptions">GetTextOptions</a>) =&gt; Promise&lt;string&gt;

Get the element text, it will get the body text by default if the selector is not specified.

**Example**

```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const activeTab = await _extension.browser.tabs.getActive();
  if (!activeTab) return;

  console.log(await activeTab.getText('body'));
}
```

#### `browser.tabs.Tab.getHtml`
> (selector?: <a href="#browsertabselementselector">ElementSelector</a>, options?: <a href="#browsertabsgethtmloptions">GetHTMLOptions</a>) =&gt; Promise&lt;string&gt;

Get the element HTML, it will get the body HTML by default if the selector is not specified.

**Example**

```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const activeTab = await _extension.browser.tabs.getActive();
  if (!activeTab) return;

  console.log(await activeTab.getText('body'));
}
```

#### `browser.tabs.Tab.setAttributes`
> (selector?: <a href="#browsertabselementselector">ElementSelector</a>, attrs: Record&lt;string, string&gt;) =&gt; Promise&lt;string&gt;

Set the element attribute.

**Example**

```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const activeTab = await _extension.browser.tabs.getActive();
  if (!activeTab) return;

  await activeTab.setAttributes('body', {
    style: 'background-color: white',
  });
}
```

#### `browser.tabs.Tab.getAttributes`
> (selector?: <a href="#browsertabselementselector">ElementSelector</a>, attrNames?: string | string[]) =&gt; Promise&lt;string | null | Record&lt;string, string&gt;&gt;

Get the element attributes.

**Example**

```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const activeTab = await _extension.browser.tabs.getActive();
  if (!activeTab) return;

  // only get the "style" attribute
  console.log(await activeTab.getAttributes('body', 'style'));

  // get multiple attributes
  const textFieldAttrs = await activeTab.getAttributes('input', ['max', 'value']);
  console.log(textFieldsAttrs.max, textFieldsAttrs.value);

  // get all the attributes
  const buttonAttrs = await activeTab.getAttributes('button');
  console.log(buttonAttrs);
}
```

#### `browser.tabs.Tab.select`
> (selector?: <a href="#browsertabselementselector">ElementSelector</a>, values: …string[]) =&gt; Promise&lt;string[]&gt;

Select options in the <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select">&lt;select&gt;</a> tag. If the select element has the> `multiple` attribute, all the values will selected, otherwise it only select the first value.

**Example**

```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const activeTab = await _extension.browser.tabs.getActive();
  if (!activeTab) return;

  await activeTab.setAttributes('select', 'option-1');
}
```

#### `browser.tabs.Tab.selectFile`
> (selector?: <a href="#browsertabselementselector">ElementSelector</a>, files: (string | <a href="#browsertabsselectfiledata">SelectFileData</a>)[], options?: [SelectFileOptions](#browsertabsselectfileoptions)) =&gt; Promise&lt;string[]&gt;

Set the files in the <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file"> &lt;input type="file" /&gt;</a> element or simulate drag and drop files into the browser. The string in the <code>files</code> parameter is a file path.

**Example**
```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const activeTab = await _extension.browser.tabs.getActive();
  if (!activeTab) return;

  await activeTab.selectFile(
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
}
```

#### `browser.tabs.Tab.waitForSelector`
> (selector: <a href="#browsertabselementselector">ElementSelector</a>, options?: <a href="#browsertabswaitforselectoroptions">WaitForSelectorOptions</a>) =&gt; Promise&lt;ElementHandle  | null&gt;

Wait for an element until it matches the given state and selector

**Example**

```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const activeTab = await _extension.browser.tabs.getActive();
  if (!activeTab) return;

  const submitBtn = await activeTab.waitForSelector('button', { state: 'visible' });
  await submitBtn.click();

  await activeTab.waitForSelector('.loading', { state: 'hidden' });
}
```

## Types

### `browser.tabs.SelectElementOptions`

Options for the [`browser.tabs.Tab.selectElement`](#browsertabstabselectelement) method.

```ts
interface SelectElementOptions {
  title?: string;
  description?: string;
  filter?: SelectElementFilter;
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `title` | `?string` | Title that will be shown to the user when selecting an element |
| `description` | `?string` | Description that will be shown to the user when selecting an element |
| `filter` | [SelectElementFilter](#browsertabsselectelementfilter) | Filter for which element can be selected. |

### `browser.tabs.SelectElementFilter`

Filter for which element can be selected.

```ts
interface SelectElementFilter {
  selector?: string;
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `selector` | `?string` | The [CSS Selector](https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Selectors) that the element must match |

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
  selectFile(files: (string | SelectFileData)[]): Promise<void>;
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

**Example**

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

### `browser.tabs.SelectFileData`

Data of the file to select.

```ts
interface SelectFileData {
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

### `browser.tabs.SelectFileOptions`

Options for the [`browser.selectFile`](#browsertabstabselectfile) method.

```ts
interface SelectFileOptions {
  action?: 'select' | 'drag-drop';
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `action` | `?('select' \| 'drag-drop')` | Which action to simulate when selecting a file. `select` to simulate the user selecting a file on the [`<input type="file" />`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file) element. `drag-drop` simulates the user dragging and dropping the file into the element. |

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
- `detached`: Element is detached from the DOM tree.
- `visible`: Element is considered visible when:
  - The element size (height and width) is not zero
  - The element doesn't have `visibility: hidden` computed style
  - The element doesn't have `display: none` computed style
- `hidden`: Element is not in the DOM tree or element is the opposite of the `visible` state