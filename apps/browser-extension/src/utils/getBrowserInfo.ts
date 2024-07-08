import UAParser from 'ua-parser-js';
import browserInfoStorage from '../shared/storages/browser-info.storage';
import { BrowserInfo, BrowserType } from '@altdot/shared';

let cache: BrowserInfo | null = null;

async function getBrowserInfo() {
  if (cache) return cache;

  const userAgent = new UAParser();
  const browser = userAgent.getBrowser();
  const browserId = await browserInfoStorage.get();

  let browserType: BrowserType = 'chrome';
  if (browser.name?.includes('Edge')) {
    browserType = 'edge';
  } else if (browser.name?.includes('Firefox')) {
    browserType = 'firefox';
  }

  cache = {
    id: browserId,
    type: browserType,
    name: browser.name || '',
    version: browser.version || '',
  };

  return cache;
}

export default getBrowserInfo;
