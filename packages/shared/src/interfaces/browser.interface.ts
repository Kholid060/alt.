export interface BrowserExtensionTab {
  id: number;
  url: string;
  title: string;
  windowId: number;
}

export type BrowserType = 'chrome' | 'firefox' | 'edge';

export interface BrowserInfo {
  id: string;
  name: string;
  version: string;
  type: BrowserType;
}

export interface BrowserConnected extends BrowserInfo {
  focused: boolean;
  tab: BrowserExtensionTab;
}
