import QuerySelector from '@root/src/utils/QuerySelector';
import RuntimeMessage from '@root/src/utils/RuntimeMessage';
import KeyboardDriver from '@root/src/utils/driver/KeyboardDriver';
import MouseDriver from '@root/src/utils/driver/MouseDriver';

const CUSTOM_ERRORS = {
  EL_NOT_FOUND: (selector: string) =>
    new Error(`Couldn't find element with "${selector}" selector`),
  INVALID_ELEMENT: (elName: string) =>
    new Error(`Element is not a "${elName}" element`),
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

    let text = element?.textContent ?? '';
    if (element instanceof HTMLElement && options?.onlyVisibleText) {
      text = element.innerText;
    }

    return text;
  },
);

RuntimeMessage.instance.onMessage(
  'element:select',
  async (_, selector, ...values) => {
    const element = await QuerySelector.find<HTMLSelectElement>(selector);

    if (!element) throw CUSTOM_ERRORS.EL_NOT_FOUND(selector);
    if (element.tagName !== 'SELECT')
      throw CUSTOM_ERRORS.INVALID_ELEMENT(element.tagName);

    const selectedValues: string[] = [];

    if (element.multiple) {
      Array.from(element.selectedOptions).forEach((option) => {
        option.selected = false;
      });

      for (let index = 0; index < element.children.length; index += 1) {
        const child = element.children[index];
        if (
          !(child instanceof HTMLOptionElement) ||
          !values.includes(child.value)
        )
          continue;

        child.selected = true;
        selectedValues.push(child.value);
      }
    } else if (values[0]) {
      element.value = values[0];
      selectedValues.push(values[0]);
    }

    const inputEvent = new Event('input', {
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(inputEvent);

    const changeEvent = new Event('change', {
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(changeEvent);

    return selectedValues;
  },
);
