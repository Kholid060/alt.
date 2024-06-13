import { ExtensionBrowserElementSelector, sleep } from '@alt-dot/shared';
import QuerySelector from '@root/src/utils/QuerySelector';
import RuntimeMessage from '@root/src/utils/RuntimeMessage';
import KeyboardDriver from '@root/src/pages/content/driver/KeyboardDriver';
import MouseDriver from '@root/src/pages/content/driver/MouseDriver';
import ElementSelector from '../ElementSelector';
import { isElementVisible } from '@root/src/utils/elements-utils';
import ContentFileHandle from '../ContentFileHandle';
import { selectFile } from '../actions/selectFile';

const CUSTOM_ERRORS = {
  ElNotFound: (selector: string) =>
    new Error(`Couldn't find element with "${selector}" selector`),
  InvalidElement: (elName: string) =>
    new Error(`Element is not a "${elName}" element`),
};

let elementCache: { el: Element | Element[] | null; selector: string } | null =
  null;

function queryElement(
  { selector, elementIndex }: ExtensionBrowserElementSelector,
  options: { throwError: false },
): Promise<Element | null>;
function queryElement(
  { selector, elementIndex }: ExtensionBrowserElementSelector,
  options?: { throwError: true },
): Promise<Element>;
async function queryElement(
  { selector, elementIndex }: ExtensionBrowserElementSelector,
  { throwError = true }: { throwError?: boolean } = {},
): Promise<Element | null> {
  if (elementCache?.selector === selector) {
    if (typeof elementIndex === 'number') {
      const element = Array.isArray(elementCache.el)
        ? elementCache.el[elementIndex ?? 0]
        : null;
      if (element) return element;
    } else if (!Array.isArray(elementCache.el) && elementCache.el) {
      if (!elementCache.el.parentNode) {
        elementCache = null;
      } else {
        return elementCache.el;
      }
    }
  }

  if (typeof elementIndex === 'number') {
    const elements = await QuerySelector.findAll(selector);
    if (!elements || !elements[elementIndex]) {
      if (throwError) throw CUSTOM_ERRORS.ElNotFound(selector);

      return null;
    }

    elementCache = {
      selector,
      el: elements,
    };

    return elements[elementIndex];
  }

  const element = await QuerySelector.find(selector);
  if (!element) {
    if (throwError) throw CUSTOM_ERRORS.ElNotFound(selector);

    return null;
  }

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

RuntimeMessage.instance.onMessage('element:mouse-down', async (_, selector) => {
  const element = await queryElement(selector);
  MouseDriver.down(element);
});

RuntimeMessage.instance.onMessage('element:mouse-up', async (_, selector) => {
  const element = await queryElement(selector);
  MouseDriver.up(element);
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
  'element:get-html',
  async (_, selector, options) => {
    const element = selector ? await queryElement(selector) : document.body;

    let html = '';
    if (element instanceof HTMLElement) {
      html = options?.outerHTML ? element.outerHTML : element.innerHTML;
    }

    return html;
  },
);

RuntimeMessage.instance.onMessage(
  'element:select',
  async (_, selector, ...values) => {
    const element = (await queryElement(selector)) as HTMLSelectElement;

    if (element.tagName !== 'SELECT')
      throw CUSTOM_ERRORS.InvalidElement(element.tagName);

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
  'element:set-attributes',
  async (_, selector, attrs) => {
    const element = await queryElement(selector);
    for (const name in attrs) {
      element.setAttribute(name, attrs[name]);
    }
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

RuntimeMessage.instance.onMessage(
  'element:select-element',
  (() => {
    let elementSelectorInstance: ElementSelector | null = null;

    return async (_, options) => {
      if (elementSelectorInstance) {
        throw new Error('Element selector already initialized');
      }

      elementSelectorInstance = new ElementSelector(options ?? {});
      const result = await elementSelectorInstance.start();

      elementSelectorInstance = null;

      return result;
    };
  })(),
);

const WAIT_SELECTOR_RETRY_MS = 1000;
const WAIT_SELECTOR_MIN_TIMEOUT_MS = 1000;
const WAIT_SELECTOR_DEFAULT_TIMEOUT_MS = 5000;
RuntimeMessage.instance.onMessage(
  'element:wait-selector',
  async (_, selector, options) => {
    let isResolved = false;
    const { promise, reject, resolve } = Promise.withResolvers<void>();

    const timeoutMs = Math.max(
      Number(options?.timeout) || WAIT_SELECTOR_DEFAULT_TIMEOUT_MS,
      WAIT_SELECTOR_MIN_TIMEOUT_MS,
    );

    const timeout = setTimeout(() => {
      isResolved = true;
      reject(new Error('TIMEOUT'));
    }, timeoutMs);

    let element = await queryElement(selector, { throwError: false });

    const checkState = async (filterFunc: () => boolean | Promise<boolean>) => {
      if (isResolved) return;

      const isPass = await filterFunc();
      if (isPass) {
        isResolved = true;
        clearTimeout(timeout);
        resolve();
        return;
      }

      setTimeout(() => checkState(filterFunc), WAIT_SELECTOR_RETRY_MS);
    };

    switch (options?.state || 'visible') {
      case 'attached':
        checkState(async () => {
          if (!element) {
            element = await queryElement(selector, { throwError: false });
            return Boolean(element);
          }

          return true;
        });
        break;
      case 'detached':
        checkState(() => (!element ? true : !element.parentNode));
        break;
      case 'visible':
        checkState(async () => {
          if (!element) {
            element = await queryElement(selector, { throwError: false });
            if (!element) return false;
          }

          return isElementVisible(element);
        });
        break;
      case 'hidden':
        checkState(() => (!element ? true : !isElementVisible(element)));
        break;
      default:
        reject(
          new Error(
            options?.state
              ? `"${options.state}" is an invalid state value.`
              : "The state options couldn't be empty",
          ),
        );
    }

    return promise;
  },
);

RuntimeMessage.instance.onMessage(
  'element:select-file',
  async (_, selector, fileId) => {
    const element = await queryElement(selector);
    if (!(element instanceof HTMLInputElement) || element.type !== 'file') {
      throw new Error(
        'Invalid element. The element must  be "<input type="file">"',
      );
    }

    const files = await ContentFileHandle.instance.requestFile(fileId);
    selectFile(element, files);
  },
);
