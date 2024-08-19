---
title: fs
---

Enable the extension to work with the file system. The extension must have the `fs` permission to use this extension.

## Functions

### `fs.stat`
> fs.stat(path: string): Promise\<[Stats](#fsstats)>

Get the file information.

**Example**

```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const fileStat = await _extension.fs.stat('D:\\document.txt');
  console.log('File size:', fileStat.size, 'bytes');
  console.log('Last modified:', new Date(fileStat.mtime));
}
```

### `fs.readJSON`
> fs.readJSON(path: string): Promise\<Record\<any, any>>

Reads a JSON file and then parses it into an object.

**Example**

```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const jsonFile = await _extension.fs.readJSON('D:\\geojson.json');
  console.log('JSON Object:', jsonFile);
}
```

### `fs.exists`
> fs.exists(path: string): Promise\<boolean>

Check if a file or directory exists.

**Example**

```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const jsonFileExists = await _extension.fs.exists('D:\\geojson.json');
  console.log(jsonFileExists ? 'File exists' : 'File not found');
}
```

### `fs.readFile`
> fs.readFuke(path: string, options?: [ReadOptions](#fsreadoptions)): Promise\<Uint8Array | string>

Read the entire contents of a file.

**Example**

```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const csvContent = await _extension.fs.readFile('D:\\analytics.csv', { encoding: 'utf8' });
  console.log(csvContent);
}
```

### `fs.writeFile`
> fs.writeFile(path: string, data: string | Uint8Array, options?: [WriteOptions](#fswriteoptions)): Promise\<void>

Write data into a file, and replacing the file if already exists.

**Example**

```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  await _extension.fs.writeFile(
    'D:\\document.txt',
    'Hello world!!',
    { encoding: 'utf8' }
  );
  
  // Using base64 string
  await _extension.fs.writeFile(
    'D:\\document.txt',
    btoa('Hello world'),
    { encoding: 'utf8', stringType: 'base64' }
  );
}
```

### `fs.appendFile`
> fs.appendFile(path: string, data: string | Uint8Array, options?: [WriteOptions](#fswriteoptions)): Promise\<void>

Append data into the file and create it if it doesn't exist.

**Example**

```ts
import { _extension } from '@altdot/extension';

const FILE_PATH = 'D:\\a-document.txt';

async function appendAndRead() {
  await _extension.fs.appendFile(
    FILE_PATH,
    'Hello world!!',
    { encoding: 'utf8' }
  );
  const value = await _extension.fs.readFile(
    FILE_PATH,
    { encoding: 'utf8' }
  );

  return value;
}

export default async function Command() {
  console.log(await appendAndRead()); //> Hello World!!
  console.log(await appendAndRead()); //> Hello World!!Hello world!!
}
```

## Types

### `fs.Stats`

Contains information about a file.

```ts
interface Stats {
  size: number;
  atime: string;
  mtime: string;
  isFile: boolean;
  birthtime: string;
  isDirectory: boolean;
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `size` | `number` | File size in byte |
| `atime` | `number` | Timestamp the last time the file is accessed |
| `mtime` | `number` | Timestamp the last time the file is modified |
| `isFile` | `boolean` | Whether it's a file or not |
| `birthtime` | `number` | A timestamp indicating the creation time of the file |
| `isDirectory` | `boolean` | Whether it's a directory |

### `fs.ReadOptions`

Options for the [`fs.readFile`](#fsreadfile) method.

```ts
interface ReadOptions {
  encoding?: string;
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `encoding` | `?string` | Encoding of the file |

### `fs.WriteOptions`

Options for the [`fs.writeFile`](#fswritefile) and [`fs.appendFile`](#fsappendfile) method.

```ts
interface WriteOptions {
  encoding?: string;
  stringType?: 'base64';
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `encoding` | `?string` | Encoding of the file |
| `stringType` | `?('base64')` | Type of string in the `data` parameter. |
