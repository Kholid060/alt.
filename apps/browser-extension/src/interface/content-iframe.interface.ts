import { BrowserSelectFileOptions } from '@repo/shared';

export interface ContentIframeEvents {
  'file:request': (fileId: string) => Promise<BrowserSelectFileOptions[]>;
}

export interface ContentIframeToBackgroundEvents {
  'file:request': (fileId: string) => Promise<BrowserSelectFileOptions[]>;
}
