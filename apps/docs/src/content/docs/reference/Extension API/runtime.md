---
title: runtime
---

Contains information about the extension and it's environment.

## Functions

### `runtime.getFileIconURL`
> runtime.getFileIconURL(filePath: string): string;

Return the icon URL of a file.

**Example**

```tsx
// view-command.tsx
import { UiImage, _extension } from '@altdot/extension';

export default function ViewCommand() {
  return (
    <UiImage src={_extension.runtime.getFileIconURL('D:\\text.txt')} />
  )
}
```

### `runtime.getManifest`
> runtime.getManifest(): Promise&lt;[ExtensionManifest](/extensions/manifest/)>;

Get the Extension Manifest object.

### `runtime.config.getValues`
> runtime.config.getValues&lt;T>(type: [ConfigType](#runtimeconfigconfigtype)): Promise&lt;T>;

Get the extension or the current command configuration values.

```tsx
// action-command.ts
import { _extension } from '@altdot/extension';

export default async function ActionCommand() {
  const commandConfig = await _extension.runtime.config.getValues('command');
  console.log(commandConfig);

  const extensionConfig = await _extension.runtime.config.getValues('extension');
  console.log(extensionConfig);
}
```

### `runtime.config.openConfigPage`
> runtime.config.openConfigPage(type: [ConfigType](#runtimeconfigconfigtype)): Promise&lt;void>;

Open the command or the current command configuration page in the Command Bar. If the extension or the command doesn't have a configuration defined in the manifest, it will do nothing.

```tsx
// action-command.ts
import { UiImage, _extension } from '@altdot/extension';

export default async function ActionCommand() {
  const commandConfig = await _extension.runtime.config.getValues<{
    value?: string;
  }>('command');
  if (!commandConfig.value) {
    await _extension.runtime.config.openConfigPage('command');
    return;
  }

  console.log('Hello world');
}
```

## Properties

### `runtime.platform`
> [PlatformInfo](#runtimeplatforminfo)

Get information about the current platform.

## Types

### `runtime.PlatformInfo`

Contains information about the environment the extension running on.

```ts
interface PlatformInfo {
  os: PlatformOS;
  arch: PlatformArch;
  appVersion: string;
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `appVersion` | `string` | The Alt. app version |
| `os` | [`PlatformOS`](#runtimeplatformos) | The platform's operating system |
| `arch` | [`PlatformArch`](#runtimeplatformarch) | The platform's processor architecture |

### `runtime.PlatformOS`

The platform's operating system.

```ts
type PlatformOS =
  | 'aix'
  | 'android'
  | 'darwin'
  | 'freebsd'
  | 'haiku'
  | 'linux'
  | 'openbsd'
  | 'sunos'
  | 'win32'
  | 'cygwin'
  | 'netbsd';
```

### `runtime.PlatformArch`

The platform's processor architecture.

```ts
type PlatformArch =
  | 'arm'
  | 'arm64'
  | 'ia32'
  | 'loong64'
  | 'mips'
  | 'mipsel'
  | 'ppc'
  | 'ppc64'
  | 'riscv64'
  | 's390'
  | 's390x'
  | 'x64';
```

### `runtime.config.ConfigType`

The extension's config type.

```ts
type ConfigType = 'extension' | 'command';
```