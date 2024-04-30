import { ExtensionError } from '#packages/common/errors/custom-errors';
import type {
  IPCEventError,
  IPCUserExtensionEventsMap,
} from '#packages/common/interface/ipc-events.interface';
import { isExtHasApiPermission } from '#packages/common/utils/check-ext-permission';
import ExtensionMessagePortHandler from './ExtensionMessagePortHandler';
import { logger } from '/@/lib/log';
import type { ExtensionManifest } from '@repo/extension-core';
import IPCMain from '../ipc/IPCMain';
import DBService from '/@/services/database/database.service';

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

const CACHE_MAX_AGE_MS = 120_000; // 2 minutes

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

    this.extensionMessagePort = new ExtensionMessagePortHandler(
      this._onExtensionMessage,
    );

    this._initMessageListener();
  }

  private _initMessageListener() {
    IPCMain.handle('user-extension', (sender, payload) =>
      this._onExtensionMessage({ ...payload, sender }),
    );
    IPCMain.on(
      'message-port:delete:shared-extension<=>main',
      (_, { extPortId }) => {
        this.extensionMessagePort.deletePort(extPortId);
      },
    );
    IPCMain.on(
      'message-port:shared-extension<=>main',
      ({ ports: [port] }, { extPortId }) => {
        if (!port) return;

        this.extensionMessagePort.addPort(port, extPortId);
      },
    );
  }

  private async getExtensionManifest(extensionId: string) {
    const cacheData = this.extensionCache.get(extensionId);
    if (cacheData && Date.now() - cacheData.retrievedAt < CACHE_MAX_AGE_MS) {
      return cacheData.data;
    }

    const extensionManifest =
      await DBService.instance.extension.getManifest(extensionId);
    if (!extensionManifest) return null;

    this.extensionCache.set(extensionId, {
      data: extensionManifest,
      retrievedAt: Date.now(),
    });

    return extensionManifest;
  }

  private async _onExtensionMessage<T extends keyof IPCUserExtensionEventsMap>({
    key,
    args,
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