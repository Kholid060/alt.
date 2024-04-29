function onMessage({ data, ports }: Electron.MessageEvent) {
  if (data !== 'init' || !ports[0]) return;

  process.parentPort.removeListener('message', onMessage);
}

process.parentPort.addListener('message', onMessage);
