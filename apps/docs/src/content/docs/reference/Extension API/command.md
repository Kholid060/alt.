---
title: command
---

Launch or update the extension command. The extension must have the `command` permission to use this API.

## Functions

### `command.updateDetail`
> updateDetail(options: [UpdateDetailOptions](#commandupdatedetailoptions)): Promise\<void>;

Update the details of the current command.

**Examples**

```ts
import { _extension } from '@altdot/extension';

export default async function ActionCommand() {
  // update subtitle
  await _extension.command.updateDetail({ subtitle: 'Hello world' });
  
  // clear subtitle
  await _extension.command.updateDetail({ subtitle: null });
}
```

### `command.launch`
> command.launch\<T = unknown>(options: [LaunchOptions](#commandlaunchoptions)): Promise<[LaunchResult](#commandlaunchresult)\<T> \| null>;

Launch another command of the extension. It will return an error if the command is disabled or does not exist.

**Examples**

```ts
import { _extension } from '@altdot/extension';

export default async function Command() {
  const launchResult = await _extension.command.launch({
    name: 'calculate',
    args: { valA: 50, valB: 19 },
  });
  if (result.success) console.log(launchResult.result);
  else console.error(launchResult.errorMessage);
}
```

:::caution
The `waitUntilFinished` option is not working for the command that has a view
:::

## Types

### `command.UpdateDetailOptions`

Options for the [`command.updateDetail`](#commandupdatedetail) method.

```ts
interface UpdateDetailOptions {
  subtitle?: string | null;
}
```
| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `subtitle` | `?(string \| null)` | The command's subtitle |

### `command.LaunchOptions`

Options for the [`command.launch`](#commandlaunch) method.

```ts
interface LaunchOptions {
  name: string;
  waitUntilFinished?: boolean;
  args?: Record<string, unknown>;
  captureAllScriptMessages?: boolean;
}
```
| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `name` | `string` | Name of the command defined in the extension manifest |
| `waitUntilFinished` | `?boolean` | Whether to wait for the command to finish running. default to `true` <br /> This option not working for the command that has a view |
| `args` | `?Record<string, unknown>` | The command arguments as defined in the extension manifest |
| `captureAllScriptMessages` | `?boolean` | By default the [`script`](/extensions/command/#script-command) type command only return the last stdout message when the `waitUntilFinished` is `true`. Set this option to `true` to capture all the messages. |

### `command.LaunchResult`

Result when the launched command is finished running.

```ts
type LaunchResult<T = unknown> =
  | { success: true; result: T }
  | { success: false; errorMessage: string };
```
| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `success` | `boolean` | Whether the command is successfully running |
| `result` | `unknown` | The output of the command when it's successfully running |
| `errorMessage` | `string` | Error message when the command fails to run or throws an error while running |
