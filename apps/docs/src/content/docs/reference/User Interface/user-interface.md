---
title: User Interface
slug: reference/user-interface
---

The Alt app uses [React](https://react.dev/) to create the user interface and [React Dom](https://www.npmjs.com/package/react-dom) to render it, which means you can use any HTML Element. But to match the Alt app UI style, you can use the built-in React components.

- UiButton
- UiIcons
- UiImage
- UiInput
- UiLabel
- UiList
- UiSelect
- UiSelectRoot
- UiSkeleton
- UiSwitch
- UiTextarea

To render the user interface, export the React component on the `view` command type.

```tsx
// view-command.tsx
import { useState } from 'react';
import { UiButton } from '@altdot/extension';

export default function Command() {
  const [count, setCount] = useState(0);

  return (
    <>
      <p>Click count: {count}</p>
      <UiButton onClick={() => setCount(count + 1)}>Increment</UiButton>
    </>
  );
}
```