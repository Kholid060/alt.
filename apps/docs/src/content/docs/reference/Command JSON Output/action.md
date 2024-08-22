---
title: Action
sidebar:
  order: 2
---

The action that the Command Bar should perform.

```ts
type CommandJSONAction = 
  | CommandJSONActionCopy
  | CommandJSONActionPaste
  | CommandJSONActionOpenURL
  | CommandJSONActionShowFolder;
```

## Copy Action

Copy content to the clipboard.

```ts
interface CommandJSONActionCopy {
  type: 'copy';
  content: unknown;
}
```

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| `type` | `copy` | The action type |
| `content` | `unknown` | Content to copy |

**Example**

```js
console.log(JSON.stringify({
  action: {
    type: 'copy',
    content: 'Hello world!!',
  }
}))
```

## Paste Action

Paste content to the frontmost window.

```ts
interface CommandJSONActionPaste {
  type: 'paste';
  content: string;
}
```

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| `type` | `copy` | The action type |
| `content` | `string` | Content to paste |

**Example**

```js
console.log(JSON.stringify({
  action: {
    type: 'paste',
    content: 'Hello world!!',
  }
}))
```

## Open URL Action

Open URL with the desktop's default browser.

```ts
interface CommandJSONActionOpenURL {
  type: 'open-url';
  url: string;
}
```

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| `type` | `copy` | The action type |
| `url` | `string` | URL to open |

**Example**

```js
console.log(JSON.stringify({
  action: {
    type: 'open-url',
    url: 'https://google.com',
  }
}))
```

## Show in Folder Action

Show the given file in a file manager. If possible, select the file.

```ts
interface CommandJSONActionShowFolder {
  type: 'show-in-folder';
  path: string;
}
```

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| `type` | `copy` | The action type |
| `path` | `string` | Path to show in a file manager |

**Example**

```js
console.log(JSON.stringify({
  action: {
    type: 'show-in-folder',
    path: 'D:\\document.txt',
  }
}))
```
