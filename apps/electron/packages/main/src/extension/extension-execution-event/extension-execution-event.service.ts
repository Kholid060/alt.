import { ExtensionAPIMessagePayload } from '#packages/common/interface/extension.interface';
import {
  IPCUserExtensionEventsMap,
  IPCEventError,
} from '#packages/common/interface/ipc-events.interface';
import { Inject, Injectable } from '@nestjs/common';
import ExtensionMessagePortHandler from './utils/ExtensionMessagePortHandler';
import { isExtHasApiPermission } from '#packages/common/utils/check-ext-permission';
import { CustomError } from '#packages/common/errors/custom-errors';
import { LoggerService } from '/@/logger/logger.service';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessagePortMain } from 'electron';
import { ExtensionApiEvent } from './events/extension-api.event';
import { ExtensionQueryService } from '../extension-query.service';

export type ExtensionMessagePortMessageHandler = <
  T extends keyof IPCUserExtensionEventsMap,
>(
  detail: ExtensionAPIMessagePayload & {
    name: T;
    args: Parameters<IPCUserExtensionEventsMap[T]>;
  },
) => Promise<Awaited<ReturnType<IPCUserExtensionEventsMap[T]>> | IPCEventError>;

const CACHE_MAX_AGE_MS = 120_000; // 2 minutes

@Injectable()
export class ExtensionExecutionEventService {
  private messagePortHandler: ExtensionMessagePortHandler;

  constructor(
    private eventEmitter: EventEmitter2,
    private loggerService: LoggerService,
    private extensionQuery: ExtensionQueryService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.handleExecutionMessage = this.handleExecutionMessage.bind(this);
    this.messagePortHandler = new ExtensionMessagePortHandler(
      this.handleExecutionMessage,
    );
  }

  async handleExecutionMessage<T extends keyof IPCUserExtensionEventsMap>({
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
        throw new CustomError(
          `Doesn't have permission to access the "${name}" API`,
        );
      }

      const [result] = await this.eventEmitter.emitAsync(
        `extension-api:${name}`,
        new ExtensionApiEvent(
          {
            sender,
            commandId,
            browserCtx,
            extensionId: key,
            extension: extensionManifest,
          },
          args,
        ),
      );

      return result;
    } catch (error) {
      const errorPayload: IPCEventError = {
        $isError: true,
        message: 'Something went wrong',
      };

      if (error instanceof CustomError) {
        errorPayload.message = error.message;
      } else if (error instanceof Error) {
        this.loggerService.error(['execution-event-service'], error.message);
      }

      return errorPayload;
    }
  }

  addMessagePort(port: MessagePortMain, portId: string) {
    this.messagePortHandler.addPort(port, portId);
  }

  deleteMessagePort(portId: string) {
    this.messagePortHandler.deletePort(portId);
  }

  private getExtensionManifest(extensionId: string) {
    return this.cacheManager.wrap(
      `extension-execution:${extensionId}`,
      async () => {
        const extensionManifest =
          await this.extensionQuery.getManifest(extensionId);
        if (!extensionManifest) return null;

        return extensionManifest;
      },
      CACHE_MAX_AGE_MS,
    );
  }
}
