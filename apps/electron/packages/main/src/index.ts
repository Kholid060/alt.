import { Menu, app } from 'electron';
import './utils/security-restrictions';
import './utils/ipc-messages-handler';
import { platform } from 'node:process';
import updater from 'electron-updater';
import {
  registerCustomProtocols,
  registerCustomProtocolsPrivileged,
} from './utils/custom-protocol';
import WindowsManager from './window/WindowsManager';
import { APP_DEEP_LINK } from '#packages/common/utils/constant/constant';
import path from 'node:path';
import deepLinkHandler from './utils/deepLinkHandler';
import { initDefaultWebsocketServer } from './services/websocket/websocket.service';
import { registerGlobalShortcuts } from './utils/global-shortcuts';

app.commandLine.appendSwitch('wm-window-animations-disabled');

Menu.setApplicationMenu(null);
registerCustomProtocolsPrivileged();

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
      app.setAsDefaultProtocolClient(APP_DEEP_LINK, process.execPath, [
        path.resolve(process.argv[2]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient(APP_DEEP_LINK, process.execPath);
  }
}

app.on('second-instance', (_event, commandLine) => {
  const deepLink = commandLine ? commandLine.pop() : null;
  if (!deepLink || !deepLink.startsWith(APP_DEEP_LINK)) {
    return;
  }

  deepLinkHandler(deepLink);
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
 * @see https://www.electronjs.org/docs/latest/api/app#event-activate-macos Event: 'activate'.
 */
app.on('activate', () =>
  WindowsManager.instance.restoreOrCreateWindow('command'),
);

/**
 * Create the application window when the background process is ready.
 */
app
  .whenReady()
  .then(() => {
    registerGlobalShortcuts();
    registerCustomProtocols();
    initDefaultWebsocketServer();
    WindowsManager.instance.restoreOrCreateWindow('command');
    WindowsManager.instance.restoreOrCreateWindow('dashboard');
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
