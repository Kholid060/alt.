import type { BrowserExtensionTab, BrowserInfo } from '@repo/shared';

interface ServerPortEventSender {
  tabId?: number;
  windowId?: number;
  browserId: string;
}

type BrowserActionInfo = Required<ServerPortEventSender>;

export interface ServerPortEvent {
  'socket:connect': (browserInfo: BrowserInfo) => void;
  'socket:disconnect': (browserInfo: BrowserInfo, reason: string) => void;
  'tabs:active': (
    sender: ServerPortEventSender,
    tab: BrowserExtensionTab | null,
  ) => void;
  'tabs:reload': (detail: BrowserActionInfo) => void;
}
