import { Catch, ArgumentsHost } from '@nestjs/common';
import ElectronLogger from '../utils/ElectronLogger';

@Catch()
export class CustomProtocolFilter {
  constructor(private readonly scheme: string) {}

  catch(error: unknown, _host: ArgumentsHost): unknown {
    ElectronLogger._instance.error(
      {
        location: [
          'Custom protocol',
          this.scheme,
          _host.switchToHttp().getRequest()?.[0]?.url,
        ],
      },
      (<Error>error)?.message,
      error,
    );

    throw error;
  }
}
