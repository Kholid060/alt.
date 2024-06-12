import crypto from 'crypto';
import InstalledApps from '../InstalledApps';
import ExtensionLoader from '../extension/ExtensionLoader';
import './ipc-extension-messages';
import { BrowserWindow, app, clipboard, dialog, screen, shell } from 'electron';
import IPCMain from './IPCMain';
import DBService from '/@/services/database/database.service';
import { emitDBChanges } from '../database-utils';
import WindowCommand from '../../window/command-window';
import BrowserService from '/@/services/browser.service';
import WorkflowService from '/@/services/workflow.service';
import { isWSAckError } from '../extension/ExtensionBrowserElementHandle';
import ExtensionService from '/@/services/extension.service';
import OauthService from '/@/services/oauth.service';
import ExtensionWSNamespace from '/@/services/websocket/ws-namespaces/extensions.ws-namespace';
import {
  CustomError,
  ExtensionError,
} from '#packages/common/errors/custom-errors';
import { Keyboard, KeyboardKey } from '@repo/native';
import { getFileDetail } from '../getFileDetail';
import AppSettingsService from '/@/services/app-settings.service';
import dayjs from 'dayjs';
import os from 'os';
import BackupRestoreData from '../BackupRestoreData';
import { APP_BACKUP_FILE_EXT } from '#packages/common/utils/constant/app.const';

/** EXTENSION */
IPCMain.handle('extension:import', async () => {
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
IPCMain.handle('extension:reload', async (_, extId) => {
  await ExtensionLoader.instance.reloadExtension(extId);
  emitDBChanges({
    'database:get-extension': [extId],
    'database:get-extension-list': [],
  });
});
IPCMain.handle('extension:execute-command', (_, payload) => {
  return ExtensionService.instance.executeCommand(payload);
});
IPCMain.handle('extension:stop-running-command', (_, runningId) => {
  ExtensionService.instance.stopCommandExecution(runningId);
  return Promise.resolve();
});
IPCMain.handle('extension:delete', (_, extId) => {
  return DBService.instance.extension.delete(extId);
});
IPCMain.handle('extension:is-config-inputted', (_, extensionId, commandId) => {
  return DBService.instance.extension.isConfigInputted(extensionId, commandId);
});
IPCMain.handle('extension:list-running-commands', () => {
  return Promise.resolve(ExtensionService.instance.getRunningCommands());
});
IPCMain.handle(
  'extension:get-command-file-path',
  (_, extensionId, commandId) => {
    return Promise.resolve(
      ExtensionLoader.instance.getPath(extensionId, 'base', commandId),
    );
  },
);

/** APPS */
IPCMain.handle('apps:get-list', () => InstalledApps.instance.getApps());
IPCMain.handle('apps:get-browsers', () => InstalledApps.instance.getBrowsers());
IPCMain.handle('app:set-settings', (_, settings) =>
  Promise.resolve(AppSettingsService.set(settings)),
);
IPCMain.handle('app:get-settings', (_, key) =>
  // @ts-expect-error expected!!
  Promise.resolve(AppSettingsService.get(key)),
);
IPCMain.handle('app:backup-data', async ({ sender }) => {
  const browserWindow = BrowserWindow.fromWebContents(sender);
  const options: Electron.SaveDialogOptions = {
    title: 'Backup data',
    defaultPath: dayjs().format('YYYY-MM-DD HHmm'),
    filters: [
      { extensions: [APP_BACKUP_FILE_EXT], name: 'alt. app backup file' },
    ],
  };
  const dir = await (browserWindow
    ? dialog.showSaveDialog(browserWindow, options)
    : dialog.showSaveDialog(options));
  if (dir.canceled) return false;

  await BackupRestoreData.backup(dir.filePath);

  return true;
});
IPCMain.handle('app:restore-data', async ({ sender }) => {
  const browserWindow = BrowserWindow.fromWebContents(sender);
  const options: Electron.OpenDialogOptions = {
    title: 'Restore backup data',
    filters: [
      { extensions: [APP_BACKUP_FILE_EXT], name: 'alt. app backup file' },
    ],
  };
  const dir = await (browserWindow
    ? dialog.showOpenDialog(browserWindow, options)
    : dialog.showOpenDialog(options));
  if (dir.canceled) return false;

  await BackupRestoreData.restore(dir.filePaths[0]);

  return true;
});
IPCMain.handle('app:versions', () => {
  return Promise.resolve({
    $isError: false,
    app: app.getVersion(),
    os: `${process.platform}@${os.release()}`,
  });
});

/** DIALOG */
IPCMain.handle('dialog:open', ({ sender }, options) => {
  const browserWindow = BrowserWindow.fromWebContents(sender);
  return browserWindow
    ? dialog.showOpenDialog(browserWindow, options)
    : dialog.showOpenDialog(options);
});
IPCMain.handle('dialog:message-box', (_, options) => {
  return dialog.showMessageBox(options);
});

/** CLIPBOARD */
IPCMain.handle('clipboard:copy', (_, content) => {
  clipboard.writeText(content);

  return Promise.resolve();
});
IPCMain.handle('clipboard:paste', async (_) => {
  const keys = [
    process.platform === 'darwin' ? KeyboardKey.Meta : KeyboardKey.Control,
    KeyboardKey.V,
  ];
  await Keyboard.keyDown(...keys);
  await Keyboard.keyUp(...keys);
});
IPCMain.handle('clipboard:copy-buffer', (_, contentType, content) => {
  const buffer = Buffer.from(content);
  clipboard.writeBuffer(contentType, buffer);

  return Promise.resolve();
});
IPCMain.handle('clipboard:read-buffer', (_, contentType) => {
  const buffer = clipboard.readBuffer(contentType);
  return Promise.resolve(buffer.toString());
});
IPCMain.handle('clipboard:has-buffer', (_, contentType) => {
  return Promise.resolve(clipboard.has(contentType));
});

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
IPCMain.handle('command-window:close', () => {
  return WindowCommand.instance.toggleWindow(false);
});
IPCMain.handle('command-window:show', () => {
  return WindowCommand.instance.toggleWindow(true);
});

/** DATABASE */
IPCMain.handle('database:get-workflow-list', (_, option) => {
  return DBService.instance.workflow.list(option);
});
IPCMain.handle('database:get-workflow', (_, workflowId) => {
  return DBService.instance.workflow.get(workflowId);
});
IPCMain.handle(
  'database:update-workflow',
  (
    { sender },
    workflowId,
    data,
    options = { ignoreModified: false, omitDBChanges: false },
  ) => {
    return DBService.instance.workflow.update(workflowId, data, {
      ignoreModified: options.ignoreModified,
      excludeEmit: options.omitDBChanges ? [sender.id] : undefined,
    });
  },
);
IPCMain.handle('database:delete-workflow', (_, workflowId) => {
  return DBService.instance.workflow.delete(workflowId);
});
IPCMain.handle('database:insert-workflow', (_, data) => {
  return DBService.instance.workflow.insert(data);
});

IPCMain.handle('database:get-extension', (_, extensionId) => {
  return DBService.instance.extension.get(extensionId);
});
IPCMain.handle('database:get-extension-creds', () => {
  return DBService.instance.extension.getCredentials();
});
IPCMain.handle('database:get-extension-list', (_, activeExtOnly) => {
  return DBService.instance.extension.list(activeExtOnly);
});
IPCMain.handle('database:get-extension-manifest', (_, extensionId) => {
  return DBService.instance.extension.getManifest(extensionId);
});
IPCMain.handle('database:update-extension', async (_, extensionId, data) => {
  await DBService.instance.extension.update(extensionId, data);
});
IPCMain.handle('database:get-command', (_, query) => {
  return DBService.instance.extension.getCommand(query);
});
IPCMain.handle('database:get-command-list', (_, filter) => {
  return DBService.instance.extension.getCommands(filter);
});
IPCMain.handle('database:insert-extension-command', (_, data) => {
  return DBService.instance.extension.insertCommand([data]);
});
IPCMain.handle('database:get-extension-config', (_, configId) => {
  return DBService.instance.extension.getConfig(configId);
});
IPCMain.handle('database:delete-extension-command', (_, id) => {
  return DBService.instance.extension.deleteCommand(id);
});
IPCMain.handle(
  'database:update-extension-command',
  async (_, extensionId, commandId, value) => {
    await DBService.instance.extension.updateCommand(
      extensionId,
      commandId,
      value,
    );

    if (Object.hasOwn(value, 'shortcut')) {
      ExtensionService.instance.toggleShortcut(
        extensionId,
        commandId,
        value.shortcut ?? null,
      );
    }
  },
);
IPCMain.handle('database:get-running-workflows', (_) => {
  return DBService.instance.workflow.listRunningWorkflows();
});
IPCMain.handle('database:insert-extension-credential', (_, payload) => {
  return DBService.instance.extension.insertCredential(payload);
});
IPCMain.handle(
  'database:update-extension-credential',
  (_, credentialId, payload) => {
    return DBService.instance.extension.updateCredential(credentialId, payload);
  },
);
IPCMain.handle('database:get-extension-creds-value', (_, options) => {
  return DBService.instance.extension.getCredentialValueList(options);
});
IPCMain.handle(
  'database:get-extension-creds-value-detail',
  (_, credentialId, maskSecret) => {
    return DBService.instance.extension.getCredentialValueDetail(
      credentialId,
      maskSecret,
    );
  },
);
IPCMain.handle('database:delete-extension-credential', (_, id) => {
  return DBService.instance.extension.deleteCredentials(id);
});

IPCMain.handle('database:insert-extension-config', (_, config) => {
  return DBService.instance.extension.insertConfig(config);
});
IPCMain.handle('database:update-extension-config', (_, configId, data) => {
  return DBService.instance.extension.updateConfig(configId, data);
});
IPCMain.handle('database:get-workflow-history', (_, historyId) => {
  return DBService.instance.workflow.getHistory(historyId);
});
IPCMain.handle('database:get-workflow-history-list', (_, options) => {
  return DBService.instance.workflow.listHistory(options);
});
IPCMain.handle('database:insert-workflow-history', (_, payload) => {
  return DBService.instance.workflow.insertHistory(payload);
});
IPCMain.handle('database:update-workflow-history', (_, historyId, payload) => {
  return DBService.instance.workflow.updateHistory(historyId, payload);
});
IPCMain.handle('database:delete-workflow-history', (_, historyId) => {
  return DBService.instance.workflow.deleteHistory(historyId);
});
IPCMain.handle('database:extension-command-exists', (_, ids) => {
  return DBService.instance.workflow.commandExist(ids);
});
IPCMain.handle('database:get-extension-errors-list', (_, extensionId) => {
  return DBService.instance.extension.getErrorsList(extensionId);
});
IPCMain.handle('database:delete-extension-errors', (_, ids) => {
  return DBService.instance.extension.deleteErrors(ids);
});

/** SHELL */
IPCMain.handle('shell:open-in-folder', (_, filePath) => {
  shell.showItemInFolder(filePath);
  return Promise.resolve();
});
IPCMain.handle('shell:open-url', (_, url) => {
  shell.openExternal(url);
  return Promise.resolve();
});

/** SCREEN */
IPCMain.handle(
  'screen:get-cursor-position',
  async ({ sender }, relativeToWindow) => {
    const point = screen.getCursorScreenPoint();
    if (!relativeToWindow) return Promise.resolve(point);

    const browserWindow = BrowserWindow.fromWebContents(sender);
    if (!browserWindow) return Promise.resolve({ x: 0, y: 0 });

    const contentBound = browserWindow.getContentBounds();
    if (
      point.x > contentBound.x + contentBound.width ||
      point.x < contentBound.x ||
      point.y > contentBound.y + contentBound.height ||
      point.y < contentBound.y
    ) {
      return Promise.resolve({ x: 0, y: 0 });
    }

    return Promise.resolve({
      x: point.x - contentBound.x,
      y: point.y - contentBound.y,
    });
  },
);

/** WORKFLOW */
IPCMain.handle('workflow:stop-running', (_, runnerId) => {
  return WorkflowService.instance.stopRunningWorkflow(runnerId);
});
IPCMain.handle('workflow:execute', (_, payload) => {
  return WorkflowService.instance.execute(payload);
});
IPCMain.handle('workflow:save', async (_, workflowId, payload) => {
  await WorkflowService.instance.updateWorkflow(workflowId, payload);
  await WorkflowService.instance.trigger.register(workflowId);
});
IPCMain.handle('workflow:export', ({ sender }, workflowId) => {
  return WorkflowService.instance.export(
    workflowId,
    BrowserWindow.fromWebContents(sender) ?? undefined,
  );
});
IPCMain.handle('workflow:import', (_, paths) => {
  return WorkflowService.instance.import(paths);
});

/** BROWSER */
IPCMain.handle('browser:get-active-tab', async (_, browserId) => {
  if (browserId) {
    const tab = await BrowserService.instance.socket.emitToBrowserWithAck({
      args: [],
      browserId,
      name: 'tabs:get-active',
    });
    if (isWSAckError(tab)) throw new Error(tab.errorMessage);

    return {
      browserId,
      url: tab.url,
      tabId: tab.id,
      $isError: false,
      title: tab.title,
    };
  }

  const browser = await BrowserService.instance.getFocused();
  if (!browser) throw new CustomError("Couldn't find active browser");

  return {
    $isError: false,
    url: browser.tab.url,
    browserId: browser.id,
    tabId: browser.tab.id,
    title: browser.tab.title,
  };
});
IPCMain.handle('browser:get-connected-browsers', () => {
  return Promise.resolve(BrowserService.instance.getConnectedBrowsers());
});
IPCMain.handle('browser:new-tab', async (_, browserId, url) => {
  const tab = await BrowserService.instance.socket.emitToBrowserWithAck({
    browserId,
    args: [url],
    name: 'tabs:create-new',
  });
  if (isWSAckError(tab)) throw new Error(tab.errorMessage);

  return { browserId, tabId: tab.id, title: tab.title, url: tab.url };
});
IPCMain.handle(
  'browser:select-files',
  async (_, { browserId, paths, selector, tabId }) => {
    const files = await Promise.all(paths.map(getFileDetail));
    const result = await ExtensionWSNamespace.instance.emitToBrowserWithAck({
      browserId,
      name: 'tabs:select-file',
      args: [{ tabId }, { selector }, files],
    });
    if (isWSAckError(result)) {
      throw new ExtensionError(result.errorMessage);
    }

    return result;
  },
);
IPCMain.handle('browser:actions', async (_, { args, browserId, name }) => {
  const result = await ExtensionWSNamespace.instance.emitToBrowserWithAck({
    args,
    name,
    browserId,
  });
  if (isWSAckError(result)) {
    throw new ExtensionError(result.errorMessage);
  }

  return result;
});

/** CRYPTO */
IPCMain.handle('crypto:create-hash', (_, algorithm, data, options) => {
  return Promise.resolve(
    crypto
      .createHash(algorithm, { outputLength: options?.outputLength })
      .update(data)
      .digest(options?.digest ?? 'hex'),
  );
});

/** OAUTH */
IPCMain.handle('oauth:connect-account', async (_, credentialId) => {
  await OauthService.instance.startAuth(credentialId);
});
