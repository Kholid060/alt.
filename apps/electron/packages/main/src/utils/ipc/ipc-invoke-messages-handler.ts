import crypto from 'crypto';
import InstalledApps from '../InstalledApps';
import './ipc-extension-messages';
import { BrowserWindow, app, clipboard, dialog, screen, shell } from 'electron';
import IPCMain from './IPCMain';
import DatabaseService from '/@/services/database/database.service';
import WindowCommand from '../../window/command-window';
import WorkflowService from '/@/services/workflow.service';
import ExtensionService from '/@/services/extension.service';
import OauthService from '/@/services/oauth.service';
import { Keyboard, KeyboardKey } from '@alt-dot/native';
import AppSettingsService from '/@/services/app-settings.service';
import dayjs from 'dayjs';
import os from 'os';
import BackupRestoreData from '../BackupRestoreData';
import { APP_BACKUP_FILE_EXT } from '#packages/common/utils/constant/app.const';

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

  const isLocked = !browserWindow.isAlwaysOnTop();
  browserWindow.setResizable(isLocked);
  browserWindow.setSkipTaskbar(!isLocked);
  browserWindow.setAlwaysOnTop(isLocked, 'modal-panel');

  return Promise.resolve();
});

/** DATABASE */
IPCMain.handle('database:get-workflow-list', (_, option) => {
  return DatabaseService.instance.workflow.list(option);
});
IPCMain.handle('database:get-workflow', (_, workflowId) => {
  return DatabaseService.instance.workflow.get(workflowId);
});
IPCMain.handle(
  'database:update-workflow',
  (
    { sender },
    workflowId,
    data,
    options = { ignoreModified: false, omitDBChanges: false },
  ) => {
    return DatabaseService.instance.workflow.update(workflowId, data, {
      ignoreModified: options.ignoreModified,
      excludeEmit: options.omitDBChanges ? [sender.id] : undefined,
    });
  },
);
IPCMain.handle('database:delete-workflow', (_, workflowId) => {
  return DatabaseService.instance.workflow.delete(workflowId);
});
IPCMain.handle('database:insert-workflow', (_, data) => {
  return DatabaseService.instance.workflow.insert(data);
});

IPCMain.handle('database:get-extension-creds', () => {
  return DatabaseService.instance.extension.getCredentials();
});
IPCMain.handle('database:delete-extension-command', (_, id) => {
  return DatabaseService.instance.extension.deleteCommand(id);
});
IPCMain.handle(
  'database:update-extension-command',
  async (_, extensionId, commandId, value) => {
    await DatabaseService.instance.extension.updateCommand(
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
  return DatabaseService.instance.workflow.listRunningWorkflows();
});
IPCMain.handle('database:insert-extension-credential', (_, payload) => {
  return DatabaseService.instance.extension.insertCredential(payload);
});
IPCMain.handle(
  'database:update-extension-credential',
  (_, credentialId, payload) => {
    return DatabaseService.instance.extension.updateCredential(credentialId, payload);
  },
);
IPCMain.handle('database:get-extension-creds-value', (_, options) => {
  return DatabaseService.instance.extension.getCredentialValueList(options);
});
IPCMain.handle(
  'database:get-extension-creds-value-detail',
  (_, credentialId, maskSecret) => {
    return DatabaseService.instance.extension.getCredentialValueDetail(
      credentialId,
      maskSecret,
    );
  },
);
IPCMain.handle('database:delete-extension-credential', (_, id) => {
  return DatabaseService.instance.extension.deleteCredentials(id);
});

IPCMain.handle('database:get-workflow-history', (_, historyId) => {
  return DatabaseService.instance.workflow.getHistory(historyId);
});
IPCMain.handle('database:get-workflow-history-list', (_, options) => {
  return DatabaseService.instance.workflow.listHistory(options);
});
IPCMain.handle('database:insert-workflow-history', (_, payload) => {
  return DatabaseService.instance.workflow.insertHistory(payload);
});
IPCMain.handle('database:update-workflow-history', (_, historyId, payload) => {
  return DatabaseService.instance.workflow.updateHistory(historyId, payload);
});
IPCMain.handle('database:delete-workflow-history', (_, historyId) => {
  return DatabaseService.instance.workflow.deleteHistory(historyId);
});
IPCMain.handle('database:extension-command-exists', (_, ids) => {
  return DatabaseService.instance.workflow.commandExist(ids);
});
IPCMain.handle('database:get-extension-errors-list', (_, extensionId) => {
  return DatabaseService.instance.extension.getErrorsList(extensionId);
});
IPCMain.handle('database:delete-extension-errors', (_, ids) => {
  return DatabaseService.instance.extension.deleteErrors(ids);
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
