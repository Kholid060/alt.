import type {
  IPCEventError,
  IPCUserExtensionEventsMap,
} from '#common/interface/ipc-events.interface';
import InstalledApps from './InstalledApps';
import { onIpcMessage } from './ipc-messages-handler';
import { isExtHasApiPermission } from '#common/utils/check-ext-permission';
import { ExtensionError } from '#common/errors/ExtensionError';
import ExtensionLoader from './extension/ExtensionLoader';
import { logger } from '../lib/log';
import path from 'path';
import type { NativeImage } from 'electron';
import { clipboard, ipcMain, nativeImage } from 'electron';
import WindowsManager from '../window/WindowsManager';
import {
  IPC_ON_EVENT,
  IPC_POST_MESSAGE_EVENT,
} from '#packages/common/utils/constant/constant';
import ExtensionMessagePortHandler from './extension/ExtensionMessagePortHandler';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';

export type ExtensionMessageHandler = <
  T extends keyof IPCUserExtensionEventsMap,
>(detail: {
  key: string;
  name: T;
  sender: Electron.IpcMainInvokeEvent | null;
  args: Parameters<IPCUserExtensionEventsMap[T]>;
}) => Promise<
  Awaited<ReturnType<IPCUserExtensionEventsMap[T]>> | IPCEventError
>;

const onExtensionIPCEvent = (() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlers: Record<string, (...args: any[]) => any> = {};

  const onExtensionEvent: ExtensionMessageHandler = async ({
    sender,
    args,
    key,
    name,
  }) => {
    try {
      const extension = ExtensionLoader.instance.getExtensionByKey(key);
      if (
        !extension ||
        !isExtHasApiPermission(name, extension.manifest.permissions || [])
      ) {
        throw new ExtensionError("Doesn't have permission to access this API");
      }

      const handler = handlers[name];
      if (!handler) throw new Error(`"${name}" doesn't have handler`);

      const result = await handler(sender, ...args);

      return result;
    } catch (error) {
      let errorPayload: IPCEventError = {
        $isError: true,
        message: 'Something went wrong',
      };

      if (error instanceof ExtensionError) {
        errorPayload = {
          $isError: true,
          message: error.message,
        };
      } else if (error instanceof Error) {
        console.error(error);
        logger('error', ['user-extension-handler', name], error.message);
      }

      return errorPayload;
    }
  };

  onIpcMessage('user-extension', (sender, payload) =>
    onExtensionEvent({ ...payload, sender }),
  );

  const extensionPortHandler = new ExtensionMessagePortHandler({
    portMessageHandler: onExtensionEvent,
  });
  ipcMain.on(IPC_ON_EVENT.createExtensionPort, () => {
    const extensionPort = extensionPortHandler.onRequestPort();
    const commandWindow = WindowsManager.instance.getWindow('command');

    commandWindow.webContents.postMessage(
      IPC_POST_MESSAGE_EVENT.extensionPortCreated,
      null,
      [extensionPort],
    );
  });
  ipcMain.on(IPC_ON_EVENT.deleteExtensionPort, () => {
    extensionPortHandler.destroy();
  });

  return <
    T extends keyof IPCUserExtensionEventsMap,
    P extends Parameters<IPCUserExtensionEventsMap[T]>,
  >(
    name: T,
    callback: (
      ...args: [Electron.IpcMainInvokeEvent, ...P]
    ) => ReturnType<IPCUserExtensionEventsMap[T]>,
  ) => {
    handlers[name] = callback;
  };
})();

onExtensionIPCEvent('installedApps.query', async (_, query) => {
  const apps = await InstalledApps.instance.getList();

  if (query instanceof RegExp) {
    return apps.filter((app) => query.test(app.name));
  }

  if (!query.trim()) return apps;

  if (query.startsWith('startsWith:')) {
    return apps.filter((app) => app.name.startsWith(query));
  } else if (query.startsWith('endsWith:')) {
    return apps.filter((app) => app.name.endsWith(query));
  }

  return apps.filter((app) => app.name.includes(query));
});

onExtensionIPCEvent('installedApps.launch', async (_, appId) => {
  try {
    await InstalledApps.instance.launchApp(appId);

    return true;
  } catch (error) {
    const appTarget = InstalledApps.instance.getAppTarget(appId);
    logger(
      'error',
      ['installedApps.launch'],
      `Failed to launch "${path.basename(appTarget || '')}" (${(error as Error).message})`,
    );

    return false;
  }
});

onExtensionIPCEvent('clipboard.read', async (_, format) => {
  switch (format) {
    case 'html':
      return clipboard.readHTML();
    case 'image':
      return clipboard.readImage().toDataURL();
    case 'rtf':
      return clipboard.readRTF();
    case 'text':
      return clipboard.readText();
    default:
      throw new ExtensionError(`"${format}" is an invalid clipboard format`);
  }
});

const EXT_CLIPBOARD_FORMATS: ExtensionAPI.clipboard.ClipboardContentType[] = [
  'html',
  'image',
  'rtf',
  'text',
];
onExtensionIPCEvent('clipboard.write', async (_, format, value) => {
  if (!EXT_CLIPBOARD_FORMATS.includes(format)) {
    throw new ExtensionError(`"${format}" is an invalid clipboard format`);
  }

  let clipboardVal: string | NativeImage = value;
  if (format === 'image') clipboardVal = nativeImage.createFromDataURL(value);

  clipboard.write({
    [format]: clipboardVal,
  });
});
