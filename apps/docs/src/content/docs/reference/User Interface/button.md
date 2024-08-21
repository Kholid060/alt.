---
title: Button
---

Button components to render button.

## Components

### UiButton

**Example**

```tsx
// view-command.tsx
import { UiButton } from '@altdot/extension';

export default function Command() {
  return (
    <UiButton>Hello world</UiButton>
  );
}
```

**Props**

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link'` | The button's variant. Default to `default` |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon' \| 'icon-sm'` | The button's size. Default to `default` |
