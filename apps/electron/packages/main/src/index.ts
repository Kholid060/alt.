import { Menu, app } from 'electron';
import './utils/security-restrictions';
import './utils/ipc/ipc-send-message-handler';
import './utils/ipc/ipc-invoke-messages-handler';
import { platform } from 'node:process';
import updater from 'electron-updater';
import CustomProtocol from './utils/custom-protocol/CustomProtocol';
import path from 'node:path';
import DeepLink from './utils/DeepLink';
import WebsocketService from './services/websocket/websocket.service';
import GlobalShortcut from './utils/GlobalShortcuts';
import ExtensionLoader from './utils/extension/ExtensionLoader';
import DBService from './services/database/database.service';
import WorkflowService from './services/workflow.service';
import WindowCommand from './window/command-window';
import ExtensionService from './services/extension.service';
import TrayService from './services/tray.service';
import AppSettingsService from './services/app-settings.service';
import { APP_DEEP_LINK_SCHEME } from '@alt-dot/shared';

app.commandLine.appendSwitch('wm-window-animations-disabled');

Menu.setApplicationMenu(null);
CustomProtocol.registerPrivileged();

/**
 * Prevent electron from running multiple instances.
 */
const isSingleInstance = app.requestSingleInstanceLock();
if (!isSingleInstance) {
  app.quit();
  process.exit(0);
} else {
  // Register deep link
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(APP_DEEP_LINK_SCHEME, process.execPath, [
        path.resolve(process.argv[2]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient(APP_DEEP_LINK_SCHEME, process.execPath);
  }
}

app.on('second-instance', (_event, commandLine) => {
  const deepLink = commandLine ? commandLine.pop() : null;
  if (!deepLink || !deepLink.startsWith(APP_DEEP_LINK_SCHEME)) {
    return;
  }

  DeepLink.handler(deepLink);
});

/**
 * Disable Hardware Acceleration to save more system resources.
 */
app.disableHardwareAcceleration();

/**
 * Shout down background process if all windows was closed
 */
app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Create the application window when the background process is ready.
 */
app
  .whenReady()
  .then(async () => {
    await DBService.instance.initDB();

    CustomProtocol.registerProtocols();
    WebsocketService.startDefaultServer();
    TrayService.instance.init();
    AppSettingsService.init();

    await Promise.all([
      GlobalShortcut.instance.init(),
      WorkflowService.instance.init(),
      ExtensionLoader.instance.loadExtensions(),
    ]);

    await ExtensionService.instance.registerAllShortcuts();
    await WindowCommand.instance.restoreOrCreateWindow();
  })
  .catch((e) => console.error('Failed create window:', e));

/**
 * Install Vue.js or any other extension in development mode only.
 * Note: You must install `electron-devtools-installer` manually
 */
// if (import.meta.env.DEV) {
//   app
//     .whenReady()
//     .then(() => import('electron-devtools-installer'))
//     .then(module => {
//       const {default: installExtension, VUEJS3_DEVTOOLS} =
//         // @ts-expect-error Hotfix for https://github.com/cawa-93/vite-electron-builder/issues/915
//         typeof module.default === 'function' ? module : (module.default as typeof module);
//
//       return installExtension(VUEJS3_DEVTOOLS, {
//         loadExtensionOptions: {
//           allowFileAccess: true,
//         },
//       });
//     })
//     .catch(e => console.error('Failed install extension:', e));
// }

/**
 * Check for app updates, install it in background and notify user that new version was installed.
 * No reason run this in non-production build.
 * @see https://www.electron.build/auto-update.html#quick-setup-guide
 *
 * Note: It may throw "ENOENT: no such file app-update.yml"
 * if you compile production app without publishing it to distribution server.
 * Like `npm run compile` does. It's ok 😅
 */
if (import.meta.env.PROD) {
  app
    .whenReady()
    .then(() => updater.autoUpdater.checkForUpdatesAndNotify())
    .catch((e) => console.error('Failed check and install updates:', e));
}
