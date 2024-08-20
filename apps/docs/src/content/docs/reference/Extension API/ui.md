---
title: ui
---

Enables the extension to interact with the command bar window.

## Functions

### `ui.createToast`
> ui.createToast(options: [ToastOptions](#uitoastoptions)): [Toast](#uitoast)

Create a toast instance.

**Example**

```ts
import { _extension } from '@altdot/extension';

export default function Command() {
  const toast = _extension.ui.createToast({
    title: 'Hello world',
  });
  toast.show();

  setTimeout(() => {
    toast.hide();
  }, 1000);
}
```

### `ui.showToast`
> ui.showToast(options: [ToastOptions](#uitoastoptions)): void

Create and show toast

**Example**

```ts
import { _extension } from '@altdot/extension';

export default function Command() {
  _extension.ui.showToast({
    title: 'Hello world',
  });
}
```

### `ui.closeWindow`
> ui.closeWindow(): Promise\<void>

Close the command bar window

**Example**

```ts
import { _extension } from '@altdot/extension';

export default function Command() {
  _extension.ui.closeWindow();
}
```

### `ui.searchPanel.clearValue`
> ui.searchPanel.clearValue(): void

Clear the command bar search panel value.

**Example**

```ts
import { _extension } from '@altdot/extension';

export default function Command() {
  _extension.ui.searchPanel.clearValue();
}
```

### `ui.searchPanel.updatePlaceholder`
> ui.searchPanel.updatePlaceholder(placeholder: string): void

Update the command bar search panel placeholder.

**Example**

```ts
import { _extension } from '@altdot/extension';

export default function Command() {
  _extension.ui.searchPanel.updatePlaceholder('Search items...');
}
```

### `ui.alert.confirm`
> ui.alert.confirm(options: [ConfirmOptions](#uialertconfirmoptions)): Promise\<boolean>

Show confirmation alert.

**Example**

```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const isConfirmed = await _extension.ui.alert.confirm({
    title: 'Are you sure you want to continue?',
    body: "You can't undo this action",
    okText: 'Continue'
  });
  if (isConfirmed) {
    console.log('Hello world!');
  }
}
```

## Events

### `ui.searchPanel.onChanged`
> [Events.Event](/reference/extension-api/events/#eventsevent)<(value: string) => void>

Fired when the command bar search panel value is changed.

**Example**

```tsx
import { useEffect, useState } from 'react';
import { _extension } from '@altdot/extension';

export default function Command() {
  const [value, setValue] = useState('');

  useEffect(
    () =>
      _extension.ui.searchPanel.onChanged.addListener((search) =>
        setValue(search),
      ),
    [],
  );

  return <>{value}</>;
}
```

### `ui.searchPanel.onKeydown`
> [Events.Event](/reference/extension-api/events/#eventsevent)<(event: [KeydownEvent](#uisearchpanelkeydownevent)) => void>

Fired when a keys is pressed on the command bar search panel.

**Example**

```tsx
import { useEffect, useState } from 'react';
import { _extension } from '@altdot/extension';

export default function Command() {
  const [value, setValue] = useState('');

  useEffect(
    () =>
      _extension.ui.searchPanel.onKeydown.addListener((event) => {
        if (event.key === 'Enter' && event.ctrlKey) {
          setValue('Hello world!');
        }
      }),
    [],
  );

  return <>{value}</>;
}
```

## Types

### `ui.ToastOptions`

Options for the [`ui.createToast`](#uicreatetoast) method.

```ts
interface ToastOptions {
  title: string;
  timeout?: number;
  description?: string;
  type?: 'loading' | 'error' | 'success';
}
```
| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `title` | `string` | The toast's title |
| `description` | `?string` | The toast's description |
| `type` | `?('loading' \| 'error' \| 'success')` | The toast's type |
| `timeout` | `?number` | How long to display the toast in milliseconds. Default to `3000` |

### `ui.Toast`

The toast instance.

```ts
interface Toast extends ToastOptions {
  hide(): void;
  show(options?: Partial<ToastOptions>): void;
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `hide` | `() => void` | Hide the toast |
| `hide` | <code>(options: Partial<[ToastOptions](#uitoastoptions)>) => void</code> | Show the toast |

### `ui.searchPanel.KeyDownEvent`

Event when key is pressed on the command bar search panel.

```ts
interface KeydownEvent {
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `key` | `string` | The pressed key |
| `altKey` | `boolean` | Whether the alt key is pressed |
| `ctrlKey` | `boolean` | Whether the ctrl key is pressed |
| `metaKey` | `boolean` | Whether the meta key is pressed |
| `shiftKey` | `boolean` | Whether the shift key is pressed |

### `ui.alert.ConfirmOptions`

Options for the [`ui.alert.confirm`](#uialertconfirm) method.

```ts
interface ConfirmOptions {
  title: string;
  body?: string;
  okText?: string;
  cancelText?: string;
  okVariant?: ButtonVariant;
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `title` | `string` | The confirm title |
| `body` | `?string` | The confirm body |
| `okText` | `?string` | The confirm ok text button |
| `cancelText` | `?string` | The confirm cancel text button |
| `okText` | [`?ButtonVariant`](#uialertbuttonvariant) | The confirm ok button variant |

### `ui.alert.ButtonVariant`

The alert button variant.

```ts
type ButtonVariant = 'default' | 'secondary' | 'destructive';
```