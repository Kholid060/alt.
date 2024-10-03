import { AppModule } from './app.module';
import ElectronLogger from './common/utils/ElectronLogger';
import ElectronNest from './ElectronNest';
import { Menu, app } from 'electron';
import updater from 'electron-updater';
import { APP_USER_MODEL_ID } from '@altdot/shared';
import { devtoolsExtInstaller } from './common/utils/devtools-ext-installer';
import { applySecurity } from './common/utils/security-restrictions';

console.time('startup');

ElectronLogger._instance.log('Starting app');
updater.autoUpdater.logger = ElectronLogger._instance;

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
  logger: import.meta.env.DEV ? console : ElectronLogger._instance,
});
await electronNest.init();

console.timeEnd('startup');

/**
 * Install React or any other extension in development mode only.
 * Note: You must install the extension in Google Chrome first
 */
if (import.meta.env.DEV) {
  devtoolsExtInstaller();
}
