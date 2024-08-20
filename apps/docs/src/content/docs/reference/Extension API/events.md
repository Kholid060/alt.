---
title: events
---

Common types used by APIs that dispatch events.

## Types

### `events.Event`

API event type.

```ts
interface Event<T extends (...args: any[]) => any> {
  removeListener(callback: T): void;
  addListener(callback: T): () => void;
}
```