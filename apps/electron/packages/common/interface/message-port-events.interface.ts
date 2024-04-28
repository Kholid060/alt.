import type { ExtensionMessagePortEvent } from '@repo/extension';
import type { MESSAGE_PORT_CHANNEL_IDS } from '../utils/constant/constant';

export type MessagePortChannelIds =
  (typeof MESSAGE_PORT_CHANNEL_IDS)[keyof typeof MESSAGE_PORT_CHANNEL_IDS];

export interface MessagePortSharedCommandWindowEvents
  extends ExtensionMessagePortEvent {}

export interface MessagePortChannelEventsMap {
  [MESSAGE_PORT_CHANNEL_IDS.sharedWithCommand]: MessagePortSharedCommandWindowEvents;
}

export interface MessagePortEventPayload {
  name: string;
  args: unknown[];
}
