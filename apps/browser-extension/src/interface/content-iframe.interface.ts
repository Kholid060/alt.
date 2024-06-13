import { BrowserSelectFileOptions } from '@alt-dot/shared';

export interface ContentIframeEvents {
  'file:request': (fileId: string) => Promise<BrowserSelectFileOptions[]>;
}

export interface ContentIframeToBackgroundEvents {
  'file:request': (fileId: string) => Promise<BrowserSelectFileOptions[]>;
}
