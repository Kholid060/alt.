import { ExtensionBrowserElementSelector, sleep } from '@repo/shared';
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

let elementCache: { el: Element | Element[] | null; selector: string } | null =
  null;

async function queryElement({
  selector,
  elementIndex,
}: ExtensionBrowserElementSelector): Promise<Element> {
  if (elementCache?.selector === selector) {
    if (typeof elementIndex === 'number') {
      const element = Array.isArray(elementCache.el)
        ? elementCache.el[elementIndex ?? 0]
        : null;
      if (element) return element;
    } else if (!Array.isArray(elementCache.el) && elementCache.el) {
      return elementCache.el;
    }
  }

  if (typeof elementIndex === 'number') {
    const elements = await QuerySelector.findAll(selector);
    if (!elements || !elements[elementIndex])
      throw CUSTOM_ERRORS.EL_NOT_FOUND(selector);

    elementCache = {
      selector,
      el: elements,
    };

    return elements[elementIndex];
  }

  const element = await QuerySelector.find(selector);
  if (!element) throw CUSTOM_ERRORS.EL_NOT_FOUND(selector);

  elementCache = {
    selector,
    el: element,
  };

  return element;
}

RuntimeMessage.instance.onMessage('element:click', async (_, selector) => {
  const element = await queryElement(selector);
  MouseDriver.click(element);
});

RuntimeMessage.instance.onMessage(
  'element:keyboard-type',
  async (_, selector, text, options) => {
    const element = await queryElement(selector);

    await KeyboardDriver.type(element, text, options);
  },
);

RuntimeMessage.instance.onMessage(
  'element:get-text',
  async (_, selector, options) => {
    const element = selector ? await queryElement(selector) : document.body;

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
    const element = (await queryElement(selector)) as HTMLSelectElement;

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

RuntimeMessage.instance.onMessage(
  'element:key-down',
  async (_, selector, key, options) => {
    const element = await queryElement(selector);

    KeyboardDriver.keyDown({
      key,
      el: element,
      text: options?.text,
      modifiers: options?.modifiers,
    });
  },
);

RuntimeMessage.instance.onMessage(
  'element:key-up',
  async (_, selector, key, options) => {
    const element = await queryElement(selector);

    if (options.delay && options.delay > 0) {
      await sleep(options.delay);
    }

    KeyboardDriver.keyUp({
      key,
      el: element,
      modifiers: options?.modifiers,
    });
  },
);

RuntimeMessage.instance.onMessage(
  'element:press',
  async (_, selector, key, options) => {
    const element = await queryElement(selector);

    KeyboardDriver.keyDown({
      key,
      el: element,
      text: options?.text,
      modifiers: options?.modifiers,
    });

    if (options?.delay && options.delay > 0) {
      await sleep(options.delay);
    }

    KeyboardDriver.keyUp({
      key,
      el: element,
      modifiers: options?.modifiers,
    });
  },
);

RuntimeMessage.instance.onMessage(
  'element:get-attributes',
  async (_, selector, attrNames) => {
    const element = await queryElement(selector);

    if (!attrNames) {
      return Object.fromEntries(
        Array.from(element.attributes).map((attr) => [attr.name, attr.value]),
      );
    }
    if (Array.isArray(attrNames)) {
      const result: Record<string, string> = {};
      attrNames.forEach((name) => {
        if (!element.hasAttribute(name)) return;

        result[name] = element.getAttribute(name)!;
      });

      return result;
    }

    return element.getAttribute(attrNames);
  },
);

RuntimeMessage.instance.onMessage(
  'element:element-exists',
  async (_, selector, multiple) => {
    if (multiple) {
      const elements = await QuerySelector.findAll(selector);
      return elements?.map((_, index) => index) ?? [];
    }

    const element = await QuerySelector.find(selector);
    return Boolean(element);
  },
);
