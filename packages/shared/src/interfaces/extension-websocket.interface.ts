export interface BrowserExtensionTab { title: string; url: string; id: number; windowId: number }

export interface ExtensionWSClientToServerEvents {
  ping: () => void;
  'tabs:active': (tab: BrowserExtensionTab | null) => void;
}

export interface ExtensionWSServerToClientEvents {
  ping: () => void;
}