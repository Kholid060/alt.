---
title: sqlite
---

Enable the extension to query the local SQLite database.

## Functions

### `sqlite.sql`
> sqlite.sql(sql: string): [Statement](#sqlitestatement)

Execute sql string.

### `sqlite.exec`
> sqlite.exec(sql: string): Promise\<void>

Execute sql string. Unlike the [`sqlite.sql`](#sqlitesql) this can execute strings that contain multiple SQL statements. This method performs worse and less safe.

**Example**
```ts
import { _extension } from '@aldot/extension';
import migration from './migrate-schema.sql?raw';

await _extension.sqlite.exec(migration);
```

### `sqlite.open`
> sqlite.exec(options: [OpenOptions](#sqliteopenoptions)): [Database](#sqlitedatabase)

Open existing SQlite database.

**Example**
```ts
import { _extension } from '@aldot/extension';

const db = _extension.sqlite.open({ path: '/path/to/db-file' });
console.log(await db.sql('SELECT * from table').all());
```

## Classes

### `sqlite.Database`

An object representing a single SQlite database.

```ts
class Database {
  close(): Promise<void>;
  execute(sql: string): void;
  sql<T = unknown>(sql: string): Statement<T>;
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `execute` | `(sql: string) => void` | Same as the [`sqlite.exec`](#sqliteexec) method |
| `sql` | <code>\<T = unknown>(sql: string): [Statement](#sqlitestatement)\<T></code> | Same as the [`sqlite.sql`](#sqlitesql) method |
| `close` | `() => Promise<void>` | Close the database connection |


### `sqlite.Statement`

An object representing a single SQL statement.

```ts
interface Statement<P = unknown> {
  run(...params: unknown[]): Promise<DBRunResult>;
  get<T = P>(...params: unknown[]): Promise<T>;
  all<T = P>(...params: unknown[]): Promise<T[]>;
}
```

#### `sqlite.Statement.run`
> sqlite.Statement.run(...params: unknown[]): Promise\<[DBRunResult](#sqlitedbrunresult)>

Run the sql string and return the changes info it made.

**Example**

```ts
import { _extension } from '@aldot/extension';

_extension.sqlite.sql('INSERT INTO users (name, age) VALUES (?, ?)').run(
  ['John Doe', 20]
);
```

#### `sqlite.Statement.get`
> sqlite.Statement.get\<T = unknown>(...params: unknown[]): Promise\<T>

Return the first row retrieved by the query.

**Example**

```ts
import { _extension } from '@aldot/extension';

interface User {
  age: number;
  name: string;
}

export default async function Command() {
  const user = await _extension.sqlite
    .sql('SELECT name, age FROM users WHERE name = ?')
    .get<User>('John Doe');

  console.log(user.name);
}
```

#### `sqlite.Statement.all`
> sqlite.Statement.all\<T = unknown>(...params: unknown[]): Promise\<T[]>

Return all the match rows.

**Example**

```ts
import { _extension } from '@aldot/extension';

export default async function Command() {
  const users = await _extension.sqlite
    .sql('SELECT name, age FROM users WHERE name = ?')
    .all('John Doe');

  console.log(users, users.length);
}
```

## Types

### `sqlite.DBRunResult`

Result when running the `run` statement.

```ts
interface DBRunResult {
  changes: number;
  lastInsertRowid: number;
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `changes` | `number` | The total number of rows that were inserted, updated, or deleted by this operation |
| `lastInsertRowid` | `number` | The [rowid](https://www.sqlite.org/lang_createtable.html#rowid) of the last row inserted into the database |

### `sqlite.OpenOptions`

Options for the [`sqlite.open`](#sqliteopen) method;

```ts
interface OpenOptions {
  path: string;
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `path` | `string` | The SQlite DB file path |
