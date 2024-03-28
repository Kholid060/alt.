import Browser from 'webextension-polyfill';

async function isContentScriptInjected(tabId: number, frameId?: number) {
  try {
    await Browser.tabs.sendMessage(tabId, 'injected', { frameId });
    return true;
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    else if (error.message.includes('Could not establish connection'))
      return false;

    throw error;
  }
}

export async function injectContentHandlerScript(tabId: number) {
  const isAlreadyInjected = await isContentScriptInjected(tabId);
  if (isAlreadyInjected) return;

  await Browser.scripting.executeScript({
    target: {
      tabId,
      allFrames: true,
    },
    files: ['./src/pages/contentInjected/index.js'],
  });
}
