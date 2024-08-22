---
title: Text View
---

Display a text.

```ts
interface CommandJSONViewText {
  type: 'text';
  text: string;
  align?: 'start' | 'end' | 'justify' | 'center';
  color?: 'destructive' | 'default' | 'muted' | 'primary';
  textStyle?: 'body' | 'body-small' | 'code' | 'heading-1' | 'heading-2' | 'heading-3' | 'heading-4';
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `type` | `text` | The view type |
| `text` | `string` | The text to display |
| `align` | `'start' \| 'end' \| 'justify' \| 'center'` | The text's align |
| `color` | `'destructive' \| 'default' \| 'muted' \| 'primary'` | The text's color. Default is `default` |
| `textStyle` | `'body' \| 'body-small' \| 'code' \| 'heading-1' \| 'heading-2' \| 'heading-3' \| 'heading-4'` | The text's style. Default is `body` |

**Example**
```js
console.log(JSON.stringify({
  view: {
    type: 'text',
    text: 'Hello world!!',
    textStyle: 'heading-2',
  }
}));
```
