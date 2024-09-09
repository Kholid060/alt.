---
title: viewAction
---

Passing message between the command view and the [command view action](/extensions/command#view-command-action).

The `viewAction` has two types of communications `sync` and `async`. `sync` is for one-way communication and `async` is for two-way communication.

## Functions

### `communicationType.sendMessage`
> communicationType.sendMessage(...args: unknown[]): unknown

To send message between the view and the view action.

**Example**
```ts
import { _extension } from '@altdot/extension';

export default async function CommandView() {
  // async message
  const result = await _extension.viewAction.async.sendMessage('async-message');
  console.log(result);

  // sync message
  _extension.viewAction.sync.sendMessage('sync-message');

  return null;
}
```

### `communicationType.on`
> communicationType.on(listener: (...args: unknown[]) => unknown): void

Listen or handle the message.  

You must only use one listener per event for the `async` type. If an `async` event has multiple listeners, it will use the latter.

**Example**
```ts
// view-command.action.ts
import { _extension } from '@altdot/extension';

// sync event
_extension.viewAction.sync.on('sync-message', () => {
  console.log('Hello world');
});

// async event
_extension.viewAction.async.on('async-message', () => {
  return Promise.resolve('Hello world!');
});
```

### `communicationType.off`
> communicationType.on(listener: (...args: unknown[]) => unknown): void

Remove the event listener.

## Event Types

If you're using TypeScript and want to add typing for the 'viewAction' events. First, you need to create a `.d.ts` file. You can put this file inside the 'types' folder in the project root, for example, `types/global.d.ts`. And inside that file add `ExtensionViewActionAsyncEvent` and `ExtensionViewActionSyncEvent` interfaces. 

```ts
// types/global.d.ts

  // For async events
interface ExtensionViewActionAsyncEvent {
  'async-event': (param: string) => string;
}

// For sync events
interface ExtensionViewActionSyncEvent {
  'sync-event': [param: string, param2: number];
}
```