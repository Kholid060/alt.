import { BrowserInfo } from '@altdot/shared';

export interface BrowserExtensionConnectedBrowser extends BrowserInfo {
  lastAccessed: number;
}
