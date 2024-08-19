---
title: notification
---

Create OS desktop notifications.

## Functions

### `notification.create`
> notification.create(options: [NotificationOptions](#notificationnotificationoptions)): Promise\<boolean>

Create and display notification.

**Example**

```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  await _extension.notification.create({
    title: 'Hello world!!',
  });
}
```

## Types

### `notification.NotificationOptions`

Data of the notification.

```ts
interface NotificationOptions {
  title: string;
  body?: string;
  silent?: boolean;
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `title` | `string` | The notification's title |
| `body` | `?string` | The notification's body |
| `silent` | `?boolean` | Whether or not to suppress the OS notification noise when showing the notification |

