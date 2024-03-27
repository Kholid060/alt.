import UAParser from 'ua-parser-js';
import browserInfoStorage from '../shared/storages/browser-info.storage';
import { BrowserInfo } from '@repo/shared';

let cache: BrowserInfo | null = null;

async function getBrowserInfo() {
  if (cache) return cache;

  const userAgent = new UAParser();
  const browser = userAgent.getBrowser();
  const browserId = await browserInfoStorage.get();

  cache = {
    id: browserId,
    name: browser.name || '',
    version: browser.version || '',
  };

  return cache;
}

export default getBrowserInfo;
