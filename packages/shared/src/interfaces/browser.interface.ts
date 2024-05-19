export interface BrowserExtensionTab {
  title: string;
  url: string;
  id: number;
  windowId: number;
}

export type BrowserType = 'chrome' | 'firefox' | 'edge';

export interface BrowserInfo {
  id: string;
  name: string;
  version: string;
  type: BrowserType;
}
