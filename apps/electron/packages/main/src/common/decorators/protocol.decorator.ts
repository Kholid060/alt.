import { applyDecorators, UseFilters } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CustomProtocolFilter } from '../filter/custom-protocol.filter';

export interface CustomProtocolOptions {
  privilege?: Electron.CustomScheme['privileges'];
}

export function CustomProtocol(
  scheme: string,
  options?: CustomProtocolOptions,
) {
  return applyDecorators(
    UseFilters(new CustomProtocolFilter(scheme)),
    MessagePattern(scheme, { type: 'protocol:custom', options }),
  );
}
