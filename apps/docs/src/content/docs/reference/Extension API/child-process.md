---
title: childProcess
---

Run child process inside the extension command. The extension must have the `childProcess` permission to use this API.

## Functions

### `childProcess.exec`
> <code>childProcess.exec\<O, E>(command: string, options: [ExecOptions](#childprocessexecoptions)): Promise<[ExecResult](#childprocessexecresult)\<O,E>>;</code>

Execute the command and return the `stdout` and `stderr` output.

**Example**
```ts
import { _extension } from '@altdot/extension';

async function ActionCommand() {
  // Get running processes
  const processes = await _extension.childProcess.exec(
    'powershell.exe Get-Process | Select-Object -Property ProcessName, Path, Product, MainWindowTitle | ConvertTo-Json'
  );
  return JSON.parse(processes.stdout);
}

export default ActionCommand;
```

## Types

### `childProcess.ExecResult`

Execution result of the [`childProcess.exec`](#childprocessexec) method.

```ts
interface ExecResult<T = unknown, P = unknown> {
  stdout: T;
  stderr: P;
}
```
| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `stdout` | `unknown` | Stdout output of the process |
| `stderr` | `unknown` | Stderr output of the process |

### `childProcess.ExecOptions`

Options for the [`childProcess.exec`](#childprocessexec) method.

```ts
interface ExecOptions {
  cwd?: string;
  timeout?: number;
  encoding?: string;
  maxBuffer?: number;
  shell?: string | boolean;
  env?: Record<PropertyKey, unknown>;
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `cwd` | `?string` | The current working directory of the child process. Default to the extension's folder |
| `timeout` | `?number` | The amount of time in milliseconds the process is allowed to run. The default is `10000` (10 seconds) |
| `encoding` | `?string` | The encoding to be used for the stdio output |
| `maxBuffer` | `?number` | Max allowed size in bytes for the stdio and stderr output. The child process will be terminated if the size is exceeded. Default is `1024*1024` |
| `shell` | `?string \| ?boolean` | If the value is `true`, the command runs inside a shell. On Unix, it uses `'/bin/sh'`, and `process.env.ComSpec` on windows. A different shell can be specified as a string |
| `env` | `Record<PropertyKey, unknown>` | Environment key-value pairs. This will extend `process.env` |
