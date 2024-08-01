import { _extension } from '@altdot/extension';

export interface ProcessItem {
  cpu: number;
  name: string;
  path: string;
  memory: number;
  processName: string;
}

export interface GroupProcessItem {
  path: string;
  product: string;
  processName: string;
  memoryTotal: number;
  processIds: number[];
}

async function fetchProcess() {
  const processStr = await _extension.command.launch<string>({
    name: 'get-process.js',
    captureAllScriptMessages: true,
  });
  if (!processStr?.success) return null;

  return JSON.parse(processStr.result) as ProcessItem[];
}

export default fetchProcess;
