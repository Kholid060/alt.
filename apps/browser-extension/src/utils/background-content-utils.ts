import { sleep, sleepWithRetry } from '@altdot/shared';
import Browser from 'webextension-polyfill';

async function isContentScriptInjected(tabId: number, frameId?: number) {
  try {
    await Browser.tabs.sendMessage(tabId, 'injected', { frameId });
    return true;
  } catch (error) {
    console.error(error);
    if (!(error instanceof Error)) throw error;
    else if (error.message.includes('Could not establish connection'))
      return false;

    throw error;
  }
}

const MAX_RETRY_COUNT = 3;

export async function injectContentHandlerScript(tabId: number) {
  const isAlreadyInjected = await isContentScriptInjected(tabId);
  if (isAlreadyInjected) return;

  let retryCount = 0;

  await sleepWithRetry(async () => {
    if (retryCount >= MAX_RETRY_COUNT) {
      throw new Error("Can't inject content script");
    }
    retryCount += 1;

    await Browser.scripting.executeScript({
      target: {
        tabId,
        allFrames: true,
      },
      files: ['./src/pages/content-script/index.js'],
    });

    await sleep(1000);

    return await isContentScriptInjected(tabId);
  }, 1000);
}
