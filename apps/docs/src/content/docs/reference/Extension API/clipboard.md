---
title: clipboard
---

Interact with the system clipboard. To use this API, the extension must have the `clipboard` permission.

## Functions

### `clipboard.read`
> clipboard.read(format: [ClipboardContentType](#clipboardclipboardcontenttype)): Promise\<string>;

Read the value of the clipboard. When the format is `image`, it will return the [Data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs) of the image.

**Examples**

```ts
import { _extension } from '@altdot/extension';

const lastCopiedText = await _extension.clipboard.read('text');
console.log(lastCopiedText);
```

### `clipboard.write`
> clipboard.write(format: [ClipboardContentType](#clipboardclipboardcontenttype), value: string): Promise\<void>;

Write value to the clipboard. If the format is `image`, the value must be the [Data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs) of the image.

```ts
import { _extension } from '@altdot/extension';

await _extension.clipboard.write('text', 'Hello world');

await _extension.clipboard.write('html', '<p>Hello world</p>');
```

### `clipboard.paste`
> clipboard.paste(value: string): Promise\<void>;

Paste the value into the frontmost app.

```ts
import { _extension } from '@altdot/extension';

await _extension.clipboard.paste('Hello world');
```

## Types

### `clipboard.ClipboardContentType`

Content type of the clipboard.

```ts
type ClipboardContentType = 'html' | 'text' | 'image' | 'rtf';
```