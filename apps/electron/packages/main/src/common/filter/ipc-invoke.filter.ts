import { Catch, ArgumentsHost } from '@nestjs/common';
import log from 'electron-log/main';
import {
  CustomError,
  ExtensionError,
  ValidationError,
} from '#packages/common/errors/custom-errors';

@Catch()
export class IpcInvokeFilter {
  constructor(private readonly channel: string) {}

  catch(error: unknown, _host: ArgumentsHost): unknown {
    if (
      error instanceof CustomError ||
      error instanceof ExtensionError ||
      error instanceof ValidationError
    ) {
      return {
        $isError: true,
        message: (error as Error).message,
      };
    }

    log.error(['IPCMainHandle', this.channel], error);

    throw error;
  }
}
