export interface BrowserExtensionTab {
  id: number;
  url: string;
  title: string;
}

export type BrowserType = 'chrome' | 'firefox' | 'edge';

export interface BrowserInfo {
  id: string;
  name: string;
  version: string;
  type: BrowserType;
}
