import { ExtensionBrowserElementSelector, sleep } from '@altdot/shared';
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
  MissingCtxElement: () =>
    new Error(
      'Missing context element. The current element might be removed from the DOM tree',
    ),
};

const elementCaches = new Map<
  string,
  { el: Element | Element[] | null; selector: string; createdAt: number }
>();

function queryElement(
  selector: ExtensionBrowserElementSelector,
  options: { throwError: false },
): Promise<Element | null>;
function queryElement(
  selector: ExtensionBrowserElementSelector,
  options?: { throwError: true },
): Promise<Element>;
async function queryElement(
  {
    selector,
    elementIndex,
    parentSelectorIndex,
    parentSelector = '',
  }: ExtensionBrowserElementSelector,
  { throwError = true }: { throwError?: boolean } = {},
): Promise<Element | null> {
  const elementKey = elementIndex
    ? `${parentSelector + parentSelectorIndex}${selector}#${elementIndex}`
    : `${parentSelector + parentSelectorIndex}${selector}`;
  const elementCache = elementCaches.get(elementKey);

  if (elementCache) {
    if (typeof elementIndex === 'number') {
      const element = Array.isArray(elementCache.el)
        ? elementCache.el[elementIndex ?? 0]
        : null;
      if (element) return element;
    } else if (!Array.isArray(elementCache.el) && elementCache.el) {
      if (!elementCache.el.parentNode) {
        elementCaches.delete(selector);
      } else {
        return elementCache.el;
      }
    }
  }

  const elementCtx = parentSelector
    ? await queryElement(
        { selector: parentSelector, elementIndex: parentSelectorIndex },
        { throwError: false },
      )
    : document;

  if (!elementCtx) {
    throw CUSTOM_ERRORS.MissingCtxElement();
  }

  if (typeof elementIndex === 'number') {
    const elements = await QuerySelector.findAll(selector);
    if (!elements || !elements[elementIndex]) {
      if (throwError) throw CUSTOM_ERRORS.ElNotFound(selector);

      return null;
    }

    elementCaches.set(elementKey, {
      selector,
      el: elements,
      createdAt: new Date().getTime(),
    });

    return elements[elementIndex];
  }

  const element = await QuerySelector.find(selector);
  if (!element) {
    if (throwError) throw CUSTOM_ERRORS.ElNotFound(selector);

    return null;
  }

  elementCaches.set(elementKey, {
    selector,
    el: element,
    createdAt: new Date().getTime(),
  });

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
  async (_, selector, key, options = {}) => {
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
  async (_, selector, fileId, options) => {
    const element = await queryElement(selector);
    const files = await ContentFileHandle.instance.requestFile(fileId);
    await selectFile(element, files, options);
  },
);
