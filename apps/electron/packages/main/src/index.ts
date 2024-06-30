import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppModule } from './app.module';
import ElectronLogger from './common/utils/ElectronLogger';
import ElectronNest from './ElectronNest';
import { Menu, app } from 'electron';
import { APP_DEEP_LINK_SCHEME, debounce } from '@alt-dot/shared';
import path from 'path';
import updater from 'electron-updater';
import './utils/security-restrictions';

async function bootstrap() {
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
  console.log(isSingleInstance);
  if (!isSingleInstance) {
    app.quit();
    process.exit(0);
    return;
  }

  /**
   * Register Deep Link
   */
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(APP_DEEP_LINK_SCHEME, process.execPath, [
        path.resolve(process.argv[2]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient(APP_DEEP_LINK_SCHEME, process.execPath);
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
    logger: new ElectronLogger(),
  });
  const eventEmitter = electronNest.app.get(EventEmitter2);
  app.on(
    'second-instance',
    // the event called twice for some reason 🤔
    debounce((_event, commandLine) => {
      const deepLink = commandLine ? commandLine.pop() : null;
      if (!deepLink || !deepLink.startsWith(APP_DEEP_LINK_SCHEME)) {
        return;
      }

      eventEmitter.emit('deep-link', deepLink);
    }, 50),
  );
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
      .catch((e) => console.error('Failed check and install updates:', e));
  }
}
bootstrap();

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
