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
  const processStr = await _extension.runtime.command.launch<string>({
    name: 'get-process.js',
    captureAllScriptMessages: true,
  });
  if (!processStr.success) return null;

  return JSON.parse(processStr.result) as ProcessItem[];

  // const processes: ProcessItem[] = JSON.parse(processStr.result);
  // console.log(processes);
  // const groupedProcesses: Record<string, GroupProcessItem> = {};
  // for (const item of processes) {
  //   if (!item.Path) continue;

  //   if (!groupedProcesses[item.ProcessName]) {
  //     let product = item.MainWindowTitle || item.Product;
  //     // Windowsr => Windows®
  //     if (item.Product?.includes('Windowsr Operating System')) {
  //       product = item.ProcessName;
  //     }

  //     groupedProcesses[item.ProcessName] = {
  //       product,
  //       path: item.Path,
  //       memoryTotal: item.WS,
  //       processIds: [item.Id],
  //       processName: item.ProcessName,
  //     };
  //   } else {
  //     groupedProcesses[item.ProcessName].memoryTotal += item.WS;
  //     groupedProcesses[item.ProcessName].processIds.push(item.Id);
  //   }
  // }

  // return Object.values(groupedProcesses);
}

export default fetchProcess;
