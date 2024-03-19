import InstalledApps from './InstalledApps';
import ExtensionLoader from './extension/ExtensionLoader';
import './ipc-extension-messages';
import { clipboard, dialog } from 'electron';
import { extensionImport } from './extension/extensionImport';
import ExtensionCommandScriptRunner from './extension/ExtensionCommandScriptRunner';
import { onIpcMessage } from './ipc-main';

onIpcMessage('extension:list', () =>
  Promise.resolve(ExtensionLoader.instance.extensions),
);
onIpcMessage('extension:get', (_, extId) =>
  Promise.resolve(ExtensionLoader.instance.getExtension(extId)),
);
onIpcMessage('extension:import', () => extensionImport());
onIpcMessage('extension:reload', (_, extId) =>
  ExtensionLoader.instance.reloadExtension(extId),
);
onIpcMessage('extension:run-script-command', async (_, detail) => {
  try {
    await ExtensionCommandScriptRunner.instance.runScript(detail);

    return {
      success: true,
      errorMessage: '',
    };
  } catch (error) {
    return {
      $isError: true,
      message: (error as Error).message,
    };
  }
});

onIpcMessage('apps:get-list', () => InstalledApps.instance.getList());

onIpcMessage('dialog:open', (_, options) => {
  return dialog.showOpenDialog(options);
});

onIpcMessage('clipboard:copy', (_, content) => {
  clipboard.writeText(content);

  return Promise.resolve();
});
