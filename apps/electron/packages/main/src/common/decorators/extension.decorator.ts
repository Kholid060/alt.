import { IPCUserExtensionEventsMap } from '#packages/common/interface/ipc-events.interface';
import { applyDecorators } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ExtensionApiEvent } from '/@/extension/extension-execution-event/events/extension-api.event';

type TypeMethodDecorator<
  T extends keyof IPCUserExtensionEventsMap,
  R = (event: ExtensionApiEvent<T>) => ReturnType<IPCUserExtensionEventsMap[T]>,
> = (
  target: object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<R>,
) => TypedPropertyDescriptor<R>;

export function OnExtensionAPI<T extends keyof IPCUserExtensionEventsMap>(
  event: T,
): TypeMethodDecorator<T> {
  return applyDecorators(
    OnEvent(`extension-api:${event}`),
  ) as TypeMethodDecorator<T>;
}
