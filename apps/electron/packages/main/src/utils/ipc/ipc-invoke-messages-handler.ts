import InstalledApps from '../InstalledApps';
import ExtensionLoader from '../extension/ExtensionLoader';
import './ipc-extension-messages';
import { BrowserWindow, clipboard, dialog, screen, shell } from 'electron';
import ExtensionCommandScriptRunner from '../extension/ExtensionCommandScriptRunner';
import IPCMain from './IPCMain';
import extensionsDB from '../../db/extension.db';
import type { ExtensionConfigData } from '#packages/common/interface/extension.interface';
import { configs } from '../../db/schema/extension.schema';
import { eq } from 'drizzle-orm';
import { ExtensionError } from '#packages/common/errors/custom-errors';
import { getExtensionConfigDefaultValue } from '../helper';
import type { IPCExtensionConfigEvents } from '#packages/common/interface/ipc-events.interface';
import DatabaseService from '/@/services/database.service';
import { GlobalShortcutExtension } from '../GlobalShortcuts';
import { toggleCommandWindow } from '/@/window/command-window';

/** EXTENSION */
IPCMain.handle('extension:import', async ({ sender }) => {
  const window = BrowserWindow.fromWebContents(sender);
  const isAlwaysOnTop = window && window.isAlwaysOnTop();
  if (isAlwaysOnTop) {
    window.setAlwaysOnTop(false);
  }

  try {
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
  } finally {
    if (isAlwaysOnTop) window.setAlwaysOnTop(true);
  }
});
IPCMain.handle('extension:reload', async (_, extId) => {
  await ExtensionLoader.instance.reloadExtension(extId);
  DatabaseService.emitDBChanges({
    'database:get-extension': [extId],
    'database:get-extension-list': [],
  });
});
IPCMain.handle('extension:run-script-command', async (_, detail) => {
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
IPCMain.handle('apps:get-list', () => InstalledApps.instance.getApps());

/** DIALOG */
IPCMain.handle('dialog:open', ({ sender }, options) => {
  const window = BrowserWindow.fromWebContents(sender);
  const isAlwaysOnTop = window && window.isAlwaysOnTop();
  if (isAlwaysOnTop) window.setAlwaysOnTop(false);

  return dialog.showOpenDialog(options).finally(() => {
    if (isAlwaysOnTop) window.setAlwaysOnTop(true);
  });
});
IPCMain.handle('dialog:message-box', (_, options) => {
  return dialog.showMessageBox(options);
});

/** CLIPBOARD */
IPCMain.handle('clipboard:copy', (_, content) => {
  clipboard.writeText(content);

  return Promise.resolve();
});

/** EXTENSION CONFIG */
IPCMain.handle('extension-config:get', async (_, configId) => {
  const result = (await extensionsDB.query.configs.findFirst({
    where: (fields, { eq }) => eq(fields.configId, configId),
  })) as ExtensionConfigData;

  return result ?? null;
});
IPCMain.handle('extension-config:set', async (_, configId, data) => {
  await extensionsDB.insert(configs).values({
    ...data,
    configId,
  });
});
IPCMain.handle('extension-config:update', async (_, configId, data) => {
  await extensionsDB
    .update(configs)
    .set(data)
    .where(eq(configs.configId, configId));
});
IPCMain.handle('extension-config:exists', (_, configId) => {
  return DatabaseService.configExists(configId);
});

const extensionConfigNeedInputCache = new Set<string>();
IPCMain.handle(
  'extension-config:need-input',
  async (_, extensionId, commandId) => {
    type ReturnValue = ReturnType<
      IPCExtensionConfigEvents['extension-config:need-input']
    >;

    const commandConfigId = `${extensionId}:${commandId}`;
    if (extensionConfigNeedInputCache.has(commandConfigId)) {
      return { requireInput: false } as ReturnValue;
    }

    const extension = await DatabaseService.getExtension(extensionId);
    if (!extension || extension.isError) {
      throw new ExtensionError('Extension not found');
    }

    const extensionConfig = getExtensionConfigDefaultValue(
      extension.config ?? [],
    );
    if (extensionConfig.requireInput) {
      const extensionConfigExists = await DatabaseService.configExists(
        extension.id,
      );
      if (!extensionConfigExists) {
        return {
          requireInput: true,
          type: 'extension',
          config: extension.config,
        } as ReturnValue;
      }
    }

    const command = extension.commands.find(
      (command) => command.name === commandId,
    );
    if (!command) throw new ExtensionError('Command not found');

    const commandConfig = getExtensionConfigDefaultValue(command.config ?? []);
    if (commandConfig.requireInput) {
      const commandConfigExists =
        await DatabaseService.configExists(commandConfigId);
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

/** APP */
IPCMain.handle('app:open-devtools', ({ sender }) => {
  sender.openDevTools();
  return Promise.resolve();
});
IPCMain.handle('app:toggle-lock-window', ({ sender }) => {
  const browserWindow = BrowserWindow.fromWebContents(sender);
  if (!browserWindow) return Promise.resolve();

  const isLocked = !browserWindow.isResizable();
  browserWindow.setResizable(isLocked);
  browserWindow.setSkipTaskbar(!isLocked);

  return Promise.resolve();
});
IPCMain.handle('app:close-command-window', () => {
  toggleCommandWindow(false);

  return Promise.resolve();
});
IPCMain.handle('app:show-command-window', () => {
  toggleCommandWindow(true);

  return Promise.resolve();
});

/** DATABASE */
IPCMain.handle('database:get-extension', (_, extensionId) => {
  return DatabaseService.getExtension(extensionId);
});
IPCMain.handle('database:get-extension-list', (_, activeExtOnly) => {
  return DatabaseService.getExtensions(activeExtOnly);
});
IPCMain.handle('database:get-extension-manifest', (_, extensionId) => {
  return DatabaseService.getExtensionManifest(extensionId);
});
IPCMain.handle('database:update-extension', async (_, extensionId, data) => {
  await DatabaseService.updateExtension(extensionId, data);
});
IPCMain.handle('database:get-command', (_, query) => {
  return DatabaseService.getExtensionCommand(query);
});
IPCMain.handle(
  'database:update-extension-command',
  async (_, extensionId, commandId, value) => {
    await DatabaseService.updateExtensionCommand(extensionId, commandId, value);

    if (Object.hasOwn(value, 'shortcut')) {
      GlobalShortcutExtension.toggleShortcut(
        extensionId,
        commandId,
        value.shortcut ?? null,
      );
    }
  },
);

/** SHELL */
IPCMain.handle('shell:open-in-folder', async (_, filePath) => {
  await shell.openPath(filePath);
});

/** SCREEN */
IPCMain.handle(
  'screen:get-cursor-position',
  async ({ sender }, relativeToWindow) => {
    const point = screen.getCursorScreenPoint();
    if (!relativeToWindow) return Promise.resolve(point);

    const browserWindow = BrowserWindow.fromWebContents(sender);
    if (!browserWindow) return Promise.resolve({ x: 0, y: 0 });

    const windowBound = browserWindow.getBounds();
    if (
      point.x > windowBound.x + windowBound.width ||
      point.x < windowBound.x ||
      point.y > windowBound.y + windowBound.height ||
      point.y < windowBound.y
    ) {
      return Promise.resolve({ x: 0, y: 0 });
    }

    return Promise.resolve({
      x: point.x - windowBound.x,
      y: point.y - windowBound.y,
    });
  },
);
