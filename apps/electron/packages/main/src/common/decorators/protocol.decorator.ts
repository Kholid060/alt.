import { applyDecorators } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

export interface CustomProtocolOptions {
  privilege?: Electron.CustomScheme['privileges'];
}

export function CustomProtocol(
  scheme: string,
  options?: CustomProtocolOptions,
) {
  return applyDecorators(
    MessagePattern(scheme, { type: 'protocol:custom', options }),
  );
}
