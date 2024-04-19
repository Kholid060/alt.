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
import ExtensionMessagePortHandler from './ExtensionMessagePortHandler';
import { logger } from '/@/lib/log';
import WindowsManager from '/@/window/WindowsManager';
import type { ExtensionManifest } from '@repo/extension-core';
import DatabaseService from '/@/services/database.service';
import IPCMain from '../ipc/IPCMain';

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
      extensionId: string;
      extension: ExtensionManifest;
      sender: Electron.IpcMainInvokeEvent;
    },
    ...Parameters<IPCUserExtensionEventsMap[T]>,
  ]
) => ReturnType<IPCUserExtensionEventsMap[T]>;

const CACHE_MAX_AGE_MS = 300_000; // 5 minutes

class ExtensionIPCEvent {
  static instance = new ExtensionIPCEvent();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlers: Map<string, (...args: any[]) => any> = new Map();

  private extensionMessagePort: ExtensionMessagePortHandler;
  private extensionCache: Map<
    string,
    { data: ExtensionManifest; retrievedAt: number }
  > = new Map();

  constructor() {
    this._onExtensionMessage = this._onExtensionMessage.bind(this);

    this.extensionMessagePort = new ExtensionMessagePortHandler({
      portMessageHandler: this._onExtensionMessage,
    });

    this._initMessageListener();
  }

  private _initMessageListener() {
    IPCMain.handle('user-extension', (sender, payload) =>
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

  private async getExtensionManifest(extensionId: string) {
    const cacheData = this.extensionCache.get(extensionId);
    if (cacheData && Date.now() - cacheData.retrievedAt < CACHE_MAX_AGE_MS) {
      return cacheData.data;
    }

    const extensionManifest =
      await DatabaseService.getExtensionManifest(extensionId);
    if (!extensionManifest) return null;

    this.extensionCache.set(extensionId, {
      data: extensionManifest,
      retrievedAt: Date.now(),
    });

    return extensionManifest;
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
      const extensionManifest = await this.getExtensionManifest(key);
      if (
        !extensionManifest ||
        !isExtHasApiPermission(name, extensionManifest.permissions || [])
      ) {
        throw new ExtensionError(
          `Doesn't have permission to access the "${name}" API`,
        );
      }

      const handler = this.handlers.get(name);
      if (!handler) throw new Error(`"${name}" doesn't have handler`);

      const result = await handler(
        { sender, extension: extensionManifest, commandId, extensionId: key },
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

export default ExtensionIPCEvent;
