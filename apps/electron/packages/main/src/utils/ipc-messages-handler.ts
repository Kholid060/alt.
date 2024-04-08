import InstalledApps from './InstalledApps';
import ExtensionLoader from './extension/ExtensionLoader';
import './ipc-extension-messages';
import { BrowserWindow, clipboard, dialog } from 'electron';
import ExtensionCommandScriptRunner from './extension/ExtensionCommandScriptRunner';
import { onIpcMessage } from './ipc-main';
import extensionsDB from '../db/extension.db';
import type { ExtensionConfigData } from '#packages/common/interface/extension.interface';
import { configs } from '../db/schema/extension.schema';
import { eq } from 'drizzle-orm';
import { ExtensionError } from '#packages/common/errors/custom-errors';
import { getExtensionConfigDefaultValue } from './helper';
import ExtensionsDBController from '../db/controller/extensions-db.controller';
import type { IPCExtensionConfigEvents } from '#packages/common/interface/ipc-events.interface';
import WindowsManager from '../window/WindowsManager';

/** EXTENSION */
onIpcMessage('extension:list', () =>
  Promise.resolve(ExtensionLoader.instance.extensions),
);
onIpcMessage('extension:get', (_, extId) =>
  Promise.resolve(ExtensionLoader.instance.getExtension(extId)),
);
onIpcMessage('extension:import', async () => {
  const {
    canceled,
    filePaths: [manifestPath],
  } = await dialog.showOpenDialog({
    buttonLabel: 'Import',
    properties: ['openFile'],
    title: 'Import Extension',
    filters: [{ extensions: ['json'], name: 'Extension manifest' }],
  });
  if (canceled || !manifestPath) return null;

  const extensionData =
    await ExtensionLoader.instance.importExtension(manifestPath);

  return extensionData;
});
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

/** APPS */
onIpcMessage('apps:get-list', () => InstalledApps.instance.getList());

/** DIALOG */
onIpcMessage('dialog:open', (_, options) => {
  return dialog.showOpenDialog(options);
});
onIpcMessage('dialog:message-box', (_, options) => {
  return dialog.showMessageBox(options);
});

/** CLIPBOARD */
onIpcMessage('clipboard:copy', (_, content) => {
  clipboard.writeText(content);

  return Promise.resolve();
});

/** EXTENSION CONFIG */
onIpcMessage('extension-config:get', async (_, configId) => {
  const result = (await extensionsDB.query.configs.findFirst({
    where: (fields, { eq }) => eq(fields.configId, configId),
  })) as ExtensionConfigData;

  return result ?? null;
});
onIpcMessage('extension-config:set', async (_, configId, data) => {
  await extensionsDB.insert(configs).values({
    ...data,
    configId,
  });
});
onIpcMessage('extension-config:update', async (_, configId, data) => {
  await extensionsDB
    .update(configs)
    .set(data)
    .where(eq(configs.configId, configId));
});
onIpcMessage('extension-config:exists', (_, configId) => {
  return ExtensionsDBController.configExists(configId);
});

const extensionConfigNeedInputCache = new Set<string>();
onIpcMessage(
  'extension-config:need-input',
  async (_, extensionId, commandId) => {
    type ReturnValue = ReturnType<
      IPCExtensionConfigEvents['extension-config:need-input']
    >;

    const commandConfigId = `${extensionId}:${commandId}`;
    if (extensionConfigNeedInputCache.has(commandConfigId)) {
      return { requireInput: false } as ReturnValue;
    }

    const extension = ExtensionLoader.instance.getExtension(extensionId);
    if (!extension || extension.isError) {
      throw new ExtensionError('Extension not found');
    }

    const extensionConfig = getExtensionConfigDefaultValue(
      extension.manifest.config ?? [],
    );
    if (extensionConfig.requireInput) {
      const extensionConfigExists = await ExtensionsDBController.configExists(
        extension.id,
      );
      if (!extensionConfigExists) {
        return {
          requireInput: true,
          type: 'extension',
          config: extension.manifest.config,
        } as ReturnValue;
      }
    }

    const command = extension.manifest.commands.find(
      (command) => command.name === commandId,
    );
    if (!command) throw new ExtensionError('Command not found');

    const commandConfig = getExtensionConfigDefaultValue(command.config ?? []);
    if (commandConfig.requireInput) {
      const commandConfigExists =
        await ExtensionsDBController.configExists(commandConfigId);
      if (!commandConfigExists) {
        return {
          type: 'command',
          requireInput: true,
          config: command.config,
        } as ReturnValue;
      }
    }

    extensionConfigNeedInputCache.add(commandConfigId);

    return {
      requireInput: false,
    } as ReturnValue;
  },
);

onIpcMessage('app:open-devtools', ({ sender }) => {
  sender.openDevTools();
  return Promise.resolve();
});
onIpcMessage('app:toggle-lock-window', ({ sender }) => {
  const browserWindow = BrowserWindow.fromWebContents(sender);
  if (!browserWindow) return Promise.resolve();

  const isLocked = !browserWindow.isResizable();
  browserWindow.setResizable(isLocked);
  browserWindow.setSkipTaskbar(!isLocked);

  return Promise.resolve();
});
onIpcMessage('app:close-command-window', () => {
  const commandWindow = WindowsManager.instance.getWindow('command');
  commandWindow.minimize();
  commandWindow.hide();

  return Promise.resolve();
});
