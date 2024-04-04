import { ExtensionError } from '#packages/common/errors/custom-errors';
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
import type { ExtensionDataValid } from '#packages/common/interface/extension.interface';
import { onIpcMessage } from '../ipc-main';

export type ExtensionMessageHandler = <
  T extends keyof IPCUserExtensionEventsMap,
>(detail: {
  name: T;
  key: string;
  commandId: string;
  sender: Electron.IpcMainInvokeEvent | null;
  args: Parameters<IPCUserExtensionEventsMap[T]>;
}) => Promise<
  Awaited<ReturnType<IPCUserExtensionEventsMap[T]>> | IPCEventError
>;

export type ExtensionIPCEventCallback<
  T extends keyof IPCUserExtensionEventsMap,
> = (
  ...args: [
    detail: {
      commandId: string;
      extensionKey: string;
      extension: ExtensionDataValid;
      sender: Electron.IpcMainInvokeEvent;
    },
    ...Parameters<IPCUserExtensionEventsMap[T]>,
  ]
) => ReturnType<IPCUserExtensionEventsMap[T]>;

export class ExtensionIPCEvent {
  static instance = new ExtensionIPCEvent();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlers: Map<string, (...args: any[]) => any> = new Map();

  private extensionMessagePort: ExtensionMessagePortHandler;

  constructor() {
    this._onExtensionMessage = this._onExtensionMessage.bind(this);

    this.extensionMessagePort = new ExtensionMessagePortHandler({
      portMessageHandler: this._onExtensionMessage,
    });

    this._initMessageListener();
  }

  private _initMessageListener() {
    onIpcMessage('user-extension', (sender, payload) =>
      this._onExtensionMessage({ ...payload, sender }),
    );

    ipcMain.on(IPC_ON_EVENT.createExtensionPort, () => {
      const extensionPort = this.extensionMessagePort.createMessagePort();
      const commandWindow = WindowsManager.instance.getWindow('command');

      commandWindow.webContents.postMessage(
        IPC_POST_MESSAGE_EVENT.extensionPortCreated,
        null,
        [extensionPort],
      );
    });
    ipcMain.on(IPC_ON_EVENT.deleteExtensionPort, () => {
      this.extensionMessagePort.destroy();
    });
  }

  private async _onExtensionMessage<T extends keyof IPCUserExtensionEventsMap>({
    args,
    key,
    name,
    sender,
    commandId,
  }: {
    name: T;
    key: string;
    commandId: string;
    sender: Electron.IpcMainInvokeEvent | null;
    args: Parameters<IPCUserExtensionEventsMap[T]>;
  }): Promise<
    Awaited<ReturnType<IPCUserExtensionEventsMap[T]>> | IPCEventError
  > {
    try {
      const extension = ExtensionLoader.instance.getExtensionByKey(key);
      if (
        !extension ||
        extension.isError ||
        !isExtHasApiPermission(name, extension.manifest.permissions || [])
      ) {
        throw new ExtensionError(
          `Doesn't have permission to access the "${name}" API`,
        );
      }

      const handler = this.handlers.get(name);
      if (!handler) throw new Error(`"${name}" doesn't have handler`);

      const result = await handler(
        { sender, extension, commandId, extensionKey: key },
        ...args,
      );

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
  }

  on<T extends keyof IPCUserExtensionEventsMap>(
    name: T,
    callback: ExtensionIPCEventCallback<T>,
  ) {
    this.handlers.set(name, callback);
  }
}

export const onExtensionIPCEvent = ExtensionIPCEvent.instance.on.bind(
  ExtensionIPCEvent.instance,
);
