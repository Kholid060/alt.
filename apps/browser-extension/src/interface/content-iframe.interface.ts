import { BrowserSelectFileData } from '@altdot/shared';

export interface ContentIframeEvents {
  'file:request': (fileId: string) => Promise<BrowserSelectFileData[]>;
}

export interface ContentIframeToBackgroundEvents {
  'file:request': (fileId: string) => Promise<BrowserSelectFileData[]>;
}
