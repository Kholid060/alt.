import { ExtensionError } from '#packages/common/errors/ExtensionError';
import type {
  IPCEventError,
  IPCUserExtensionEventsMap,
} from '#packages/common/interface/ipc-events.interface';
import { isExtHasApiPermission } from '#packages/common/utils/check-ext-permission';
import {
  IPC_ON_EVENT,
  IPC_POST_MESSAGE_EVENT,
} from '#packages/common/utils/constant/constant';
import { ipcMain } from 'electron';
import ExtensionLoader from './ExtensionLoader';
import ExtensionMessagePortHandler from './ExtensionMessagePortHandler';
import { logger } from '/@/lib/log';
import WindowsManager from '/@/window/WindowsManager';
import type { ExtensionData } from '#packages/common/interface/extension.interface';
import { onIpcMessage } from '../ipc-main';

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

export const onExtensionIPCEvent = (() => {
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
        throw new ExtensionError(
          `Doesn't have permission to access the "${name}" API`,
        );
      }

      const handler = handlers[name];
      if (!handler) throw new Error(`"${name}" doesn't have handler`);

      const result = await handler({ sender, extension }, ...args);

      return result;
    } catch (error) {
      const errorPayload: IPCEventError = {
        $isError: true,
        message: 'Something went wrong',
      };

      if (error instanceof ExtensionError) {
        errorPayload.message = error.message;
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
    const extensionPort = extensionPortHandler.createMessagePort();
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
      ...args: [
        detail: {
          sender: Electron.IpcMainInvokeEvent;
          extension: ExtensionData;
        },
        ...P,
      ]
    ) => ReturnType<IPCUserExtensionEventsMap[T]>,
  ) => {
    handlers[name] = callback;
  };
})();
