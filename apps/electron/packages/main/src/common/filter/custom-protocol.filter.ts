import { Catch, ArgumentsHost } from '@nestjs/common';
import ElectronLogger from '../utils/ElectronLogger';

@Catch()
export class CustomProtocolFilter {
  constructor(private readonly scheme: string) {}

  catch(error: unknown, _host: ArgumentsHost): unknown {
    const url = _host.switchToHttp().getRequest()?.[0]?.url;

    if (!url || !url.includes('icon')) {
      ElectronLogger._instance.error(
        {
          location: ['Custom protocol', this.scheme, url],
        },
        (<Error>error)?.message,
        error,
      );
    }

    throw error;
  }
}
