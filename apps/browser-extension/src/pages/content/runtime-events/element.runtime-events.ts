import QuerySelector from '@root/src/utils/QuerySelector';
import RuntimeMessage from '@root/src/utils/RuntimeMessage';
import KeyboardDriver from '@root/src/utils/driver/KeyboardDriver';
import MouseDriver from '@root/src/utils/driver/MouseDriver';

const CUSTOM_ERRORS = {
  EL_NOT_FOUND: (selector: string) =>
    new Error(`Couldn't find element with "${selector}" selector`),
};

RuntimeMessage.instance.onMessage('element:click', async (_, selector) => {
  const element = await QuerySelector.find(selector);
  if (!element) throw CUSTOM_ERRORS.EL_NOT_FOUND(selector);

  MouseDriver.click(element);
});

RuntimeMessage.instance.onMessage(
  'element:keyboard-type',
  async (_, selector, text, options) => {
    const element = await QuerySelector.find(selector);
    if (!element) throw CUSTOM_ERRORS.EL_NOT_FOUND(selector);

    await KeyboardDriver.type(element, text, options);
  },
);

RuntimeMessage.instance.onMessage(
  'element:get-text',
  async (_, selector, options) => {
    const element = selector
      ? await QuerySelector.find(selector)
      : document.body;
    if (!element && selector) throw CUSTOM_ERRORS.EL_NOT_FOUND(selector);
    console.log(options);
    let text = element?.textContent ?? '';
    if (element instanceof HTMLElement && options?.onlyVisibleText) {
      text = element.innerText;
    }

    return text;
  },
);
