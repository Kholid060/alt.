import type {
  CommandJSONViews,
  ExtensionMessagePortEvent,
} from '@repo/extension';
import type { MESSAGE_PORT_CHANNEL_IDS } from '../utils/constant/constant';

export type MessagePortChannelIds =
  (typeof MESSAGE_PORT_CHANNEL_IDS)[keyof typeof MESSAGE_PORT_CHANNEL_IDS];

export interface MessagePortCommandJSONUpdateUI {
  commandId: string;
  processId: string;
  extensionId: string;
  viewData: CommandJSONViews;
}

export interface MessagePortSharedCommandWindowEvents
  extends ExtensionMessagePortEvent {
  'command-json:update-ui': (data: MessagePortCommandJSONUpdateUI) => void;
  'command-script:message': [
    {
      message: string;
      commandId: string;
      processId: string;
      extensionId: string;
      commandTitle: string;
      type: 'error' | 'message' | 'start' | 'finish' | 'stderr';
    },
  ];
}

export interface MessagePortChannelEventsMap {
  [MESSAGE_PORT_CHANNEL_IDS.sharedWithCommand]: MessagePortSharedCommandWindowEvents;
}

export interface MessagePortEventPayload {
  name: string;
  args: unknown[];
}
