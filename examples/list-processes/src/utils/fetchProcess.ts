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

interface ProcessRawData {
  Path: string;
  Product: string;
  ProcessName: string;
  MainWindowTitle: string | null;
}

interface ProcessPerformanceData {
  Name: string;
  WorkingSetPrivate: number;
  PercentProcessorTime: number;
}

async function powershellRunner<T = unknown>(command: string): Promise<T> {
  const result = await _extension.childProcess.exec<string, string>(
    command,
    [],
    { shell: 'powershell.exe' },
  );

  return JSON.parse(result.stdout);
}

async function fetchProcess() {
  const [rawData, processes] = await Promise.all([
    powershellRunner<ProcessPerformanceData[]>(
      "Get-WmiObject Win32_PerfFormattedData_PerfProc_Process | Where-Object { $_.name -inotmatch '_total|idle|svchost|taskhost' } | Select-Object -Property Name,PercentProcessorTime,WorkingSetPrivate | ConvertTo-Json",
    ),
    powershellRunner<ProcessRawData[]>(
      "Get-Process | Select-Object -Property ProcessName, Path, Product, MainWindowTitle | Where-Object {$_.ProcessName -inotmatch 'svchost|taskhost|wsmprovhost' -and $_.Path -ne $null} | ConvertTo-Json",
    ),
  ]);

  const data = processes.reduce<Record<string, ProcessItem>>((acc, item) => {
    if (!acc[item.ProcessName]) {
      let name = item.MainWindowTitle || item.Product || item.ProcessName;
      // Windowsr => Windows®
      if (name?.includes('Windowsr Operating System')) {
        name = item.ProcessName;
      }

      acc[item.ProcessName] = {
        name,
        cpu: 0,
        memory: 0,
        path: item.Path,
        processName: item.ProcessName,
      };
    }

    return acc;
  }, {});

  rawData.forEach((item) => {
    const hashIndex = item.Name.indexOf('#');
    const name = hashIndex === -1 ? item.Name : item.Name.slice(0, hashIndex);
    if (!data[name]) return;

    data[name].cpu += item.PercentProcessorTime;
    data[name].memory += item.WorkingSetPrivate;
  });

  return Object.values(data);
}

export default fetchProcess;
