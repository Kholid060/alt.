import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function powershellRunner(command) {
  const result = await execPromise(command, { shell: 'powershell.exe' });

  return JSON.parse(result.stdout);
}

const [rawData, processes] = await Promise.all([
  powershellRunner(
    "Get-WmiObject Win32_PerfFormattedData_PerfProc_Process | Where-Object { $_.name -inotmatch '_total|idle|svchost|taskhost' } | Select-Object -Property Name,PercentProcessorTime,WorkingSetPrivate | ConvertTo-Json",
  ),
  powershellRunner(
    "Get-Process | Select-Object -Property ProcessName, Path, Product, MainWindowTitle | Where-Object {$_.ProcessName -inotmatch 'svchost|taskhost|wsmprovhost' -and $_.Path -ne $null} | ConvertTo-Json",
  ),
]);

const data = processes.reduce((acc, item) => {
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

console.log(JSON.stringify(Object.values(data)));
