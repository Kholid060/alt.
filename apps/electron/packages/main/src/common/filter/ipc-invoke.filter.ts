import { Catch, ArgumentsHost } from '@nestjs/common';
import {
  CustomError,
  ExtensionError,
  ValidationError,
} from '#packages/common/errors/custom-errors';
import ElectronLogger from '../utils/ElectronLogger';

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

    ElectronLogger._instance.error(
      { location: ['IPCMainHandle', this.channel] },
      error,
    );

    throw error;
  }
}
