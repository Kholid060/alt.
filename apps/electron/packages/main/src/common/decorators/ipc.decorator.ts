import {
  IPCEvents,
  IPCMainSendEvent,
} from '#packages/common/interface/ipc-events.interface';
import { applyDecorators } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

export function IPCInvoke(channel: keyof IPCEvents) {
  return applyDecorators(MessagePattern(channel, { type: 'invoke' }));
}

export function IPCSend(channel: keyof IPCMainSendEvent) {
  return applyDecorators(MessagePattern(channel, { type: 'send' }));
}
