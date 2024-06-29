import {
  IPCEvents,
  IPCMainSendEvent,
} from '#packages/common/interface/ipc-events.interface';
import { UseFilters, applyDecorators } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { IpcInvokeFilter } from '../filter/ipc-invoke.filter';

export function IPCInvoke(channel: keyof IPCEvents) {
  return applyDecorators(
    UseFilters(new IpcInvokeFilter()),
    MessagePattern(channel, { type: 'ipc:invoke' }),
  );
}

export function IPCSend(channel: keyof IPCMainSendEvent) {
  return applyDecorators(MessagePattern(channel, { type: 'ipc:send' }));
}
