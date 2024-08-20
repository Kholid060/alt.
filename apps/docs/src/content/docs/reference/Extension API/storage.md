---
title: storage
---

Enables extensions to store and retrieve data. The extension must have the `storage` permission to use this API.

The storage API has two storage areas you can use: `local` and `secure`, where the value on the `secure` area will be encrypted using the electron [`safeStorage`](https://www.electronjs.org/docs/latest/api/safe-storage) API before it gets stored.

## Functions

### `storage.StorageArea.get`
> storage.StorageArea.get(key: string | string[]): Promise\<Record\<string, [Values](#storagevalues)>>;

Retrieve a value or multiple values from the storage.

**Example**
```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const { valueA } = await _extension.storage.local.get('valueA');
  console.log(valueA);

  const { valueB, valueC } = await _extension.storage.secure.get(['valueA', 'valueB']);
  console.log(valueB, valueC);
}
```

### `storage.StorageArea.getAll`
> storage.StorageArea.getAll(): Promise\<Record\<string, [Values](#storagevalues)>>;

Retrieve all the storage values.

**Example**
```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const storage = await _extension.storage.local.getAll();
  console.log(storage);
}
```

### `storage.StorageArea.set`
> storage.StorageArea.set(key: string, value: [Values](#storagevalues)): Promise\<void>;

Store a value into the storage.

**Example**
```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  await _extension.storage.local.set('valueA', 'Hello world');
}
```

### `storage.StorageArea.remove`
> storage.StorageArea.remove(key: string | string[]): Promise\<void>;

Remove a value or multiple values from the storage.

**Example**
```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  await _extension.storage.local.remove('valueA');

  // remove multiple values
  await _extension.storage.local.remove(['valueC', 'valueB']);
}
```

### `storage.StorageArea.clear`
> storage.StorageArea.clear(): Promise\<void>;

Clear the storage values.

**Example**
```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  await _extension.storage.local.clear();
  await _extension.storage.secure.clear();
}
```

## Types

### `storage.Values`

Supported values in the storage.

```ts
type Values =
  | string
  | boolean
  | number
  | null
  | Record<string | number, any>
  | Array<any>;
```
