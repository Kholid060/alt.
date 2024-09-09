---
title: shell
---

Provides functions related to desktop integration.

## Functions

### `shell.showItemInFolder`
> showItemInFolder(path: string): Promise\<void>

Show the given file in a file manager. If possible, select the file.

**Example**
```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  await _extension.shell.showItemInFolder('D:\\document.txt');
}
```

### `shell.openURL`
> shell.openURL(url: string): Promise\<void>

Open the url in the desktop's default browser.

**Example**
```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  await _extension.shell.openURL('https://example.com');
}
```

### `shell.installedApps.query`
> shell.installedApps.query(filter?: string): Promise\<[AppDetail](#shellinstalledappsappdetail)[]>

Query installed apps.

In the `query` parameter, you can write this pattern:

- `startsWith:pattern`: to filter the app where the name starts with `pattern`
- `endsWith:pattern`: to filter the app where the name ends with `pattern`
- `exact:pattern`: to filter the app where the name is exactly `pattern`

**Example**
```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const firefox = await _extension.shell.installedApps.query('endsWith:firefox');
  console.log(firefox);
}
```

### `shell.installedApps.showInFolder`
> shell.installedApps.showInFolder(appId: string): Promise\<void>

Show the installed app in a file manager.

**Example**
```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const [firefox] = await _extension.shell.installedApps.query('endsWith:firefox');
  if (firefox) await _extension.shell.installedApps.showInFolder(firefox.appId);
}
```

### `shell.installedApps.launch`
> shell.installedApps.launch(appId: string): Promise\<boolean>

Launch the installed app. It will return `true` if launch successfully.

**Example**
```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const [firefox] = await _extension.shell.installedApps.query('endsWith:firefox');
  if (firefox) await _extension.shell.installedApps.launch(firefox.appId);
}
```

### `shell.installedApps.getIconURL`
> shell.installedApps.getIconURL(appId: string): string

Get the installed app icon URL.

**Example**
```tsx
import { _extension, UiImage } from '@altdot/extension';

export default async function Command() {
  const [firefox] = await _extension.shell.installedApps.query('firefox');
  if (!firefox) return null;

  return (
    <UiImage src={_extension.shell.installedApps.getIconURL(firefox.appId)} />
  )
}
```

## Types

### `shell.InstalledApps.AppDetail`

Contains information about the installed app.

```ts
interface AppDetail {
  name: string;
  appId: string;
  description?: string;
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `name` | `string` | The app's name |
| `appId` | `string` | The app's id |
| `description` | `?string` | The app's description |
