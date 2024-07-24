import { exec } from 'child_process';
import { promisify } from 'util';

const processName = process.env.__ARGS__NAME;
if (!processName) throw new Error('Missing "name" argument');

const execPromise = promisify(exec);
await execPromise(`Stop-Process -Name "${processName}"`, {
  shell: 'powershell.exe',
});
