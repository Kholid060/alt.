import { ExtensionError } from '#packages/common/errors/custom-errors';
import type {
  IPCEventError,
  IPCUserExtensionEventsMap,
} from '#packages/common/interface/ipc-events.interface';
import { isExtHasApiPermission } from '#packages/common/utils/check-ext-permission';
import ExtensionMessagePortHandler from './ExtensionMessagePortHandler';
import { logger } from '/@/lib/log';
import type { ExtensionManifest } from '@alt-dot/extension-core';
import IPCMain from '../ipc/IPCMain';
import DatabaseService from '/@/services/database/database.service';
import type { ExtensionAPIMessagePayload } from '#packages/common/interface/extension.interface';
import type { ZodTuple, ZodTypeAny } from 'zod';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

export type ExtensionMessageHandler = <
  T extends keyof IPCUserExtensionEventsMap,
>(
  detail: ExtensionAPIMessagePayload & {
    name: T;
    args: Parameters<IPCUserExtensionEventsMap[T]>;
  },
) => Promise<Awaited<ReturnType<IPCUserExtensionEventsMap[T]>> | IPCEventError>;

type ExtensionIPCCallbackFirstParam = Pick<
  ExtensionAPIMessagePayload,
  'commandId' | 'browserCtx' | 'sender'
> & {
  extensionId: string;
  extension: ExtensionManifest;
};

export type ExtensionIPCEventCallback<
  T extends keyof IPCUserExtensionEventsMap,
> = (
  ...args: [
    detail: ExtensionIPCCallbackFirstParam,
    ...Parameters<IPCUserExtensionEventsMap[T]>,
  ]
) => ReturnType<IPCUserExtensionEventsMap[T]>;

const CACHE_MAX_AGE_MS = 120_000; // 2 minutes

class ExtensionIPCEvent {
  static instance = new ExtensionIPCEvent();

  private handlers: Map<
    string,
    {
      validator?: ZodTuple<[ZodTypeAny, ...ZodTypeAny[]]>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      func: (...args: [ExtensionIPCCallbackFirstParam, ...any[]]) => any;
    }
  > = new Map();

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

    // this._initMessageListener();
  }

  private _initMessageListener() {
    IPCMain.handle('user-extension', (sender, payload) =>
      this._onExtensionMessage({ ...payload, sender }),
    );
    IPCMain.on(
      'extension:delete-execution-message-port',
      (_, { extPortId }) => {
        this.extensionMessagePort.deletePort(extPortId);
      },
    );
    IPCMain.on(
      'extension:execution-message-port',
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
      await DatabaseService.instance.extension.getManifest(extensionId);
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
    browserCtx,
  }: ExtensionAPIMessagePayload & {
    name: T;
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

      let handlerArgs = args;

      if (handler.validator) {
        if (args.length === 0) {
          throw new ExtensionError('Arguments is empty');
        }

        const result = await handler.validator.safeParseAsync(args);
        if (!result.success) {
          throw new ExtensionError(fromZodError(result.error).message);
        }

        handlerArgs = result.data as Parameters<IPCUserExtensionEventsMap[T]>;
      }

      const result = await handler.func(
        {
          sender,
          commandId,
          browserCtx,
          extensionId: key,
          extension: extensionManifest,
        },
        ...handlerArgs,
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
    validator?: [ZodTypeAny, ...ZodTypeAny[]],
  ) {
    this.handlers.set(name, {
      func: callback,
      validator: validator ? z.tuple(validator) : undefined,
    });
  }
}

export default ExtensionIPCEvent;
