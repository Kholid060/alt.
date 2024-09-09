import { AppModule } from './app.module';
import ElectronLogger from './common/utils/ElectronLogger';
import ElectronNest from './ElectronNest';
import { Menu, app } from 'electron';
import updater from 'electron-updater';
import { APP_USER_MODEL_ID } from '@altdot/shared';
import { devtoolsExtInstaller } from './common/utils/devtools-ext-installer';
import { applySecurity } from './common/utils/security-restrictions';

ElectronLogger._instance.log('Starting app');

applySecurity();
app.setAppUserModelId(APP_USER_MODEL_ID);

/**
 * Fix flashes when toggle the command window
 * https://github.com/electron/electron/issues/22691#issuecomment-599608331
 */
app.commandLine.appendSwitch('wm-window-animations-disabled');

Menu.setApplicationMenu(null);

/**
 * Prevent electron from running multiple instances.
 */
const isSingleInstance = app.requestSingleInstanceLock();
if (!isSingleInstance) {
  app.quit();
  process.exit(0);
}

/**
 * Disable Hardware Acceleration to save more system resources.
 */
app.disableHardwareAcceleration();

/**
 * Shout down background process if all windows was closed
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Start app
 */
const electronNest = await ElectronNest.createApp(AppModule, {
  logger: console,
});
await electronNest.init();

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
    .catch((e) =>
      ElectronLogger._instance.error('Failed check and install updates:', e),
    );
}

/**
 * Install React or any other extension in development mode only.
 * Note: You must install the extension in Google Chrome first
 */
if (import.meta.env.DEV) {
  devtoolsExtInstaller();
}
