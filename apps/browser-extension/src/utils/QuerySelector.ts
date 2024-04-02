const CUSTOM_SELECTOR_KEYWORD = {
  XPATH: '::xpath=',
  SHADOW_DOM: '>>',
};

const DEFAULT_RETRY_COUNT = 5;
const DEFAULT_RETRY_TIMEOUT_MS = 1000; // 1 seconds;

type ElementContext = Element | ShadowRoot | Document;

interface QuerySelectorOptions {
  retryCount: number;
  retryTimeout: number;
  elCtx: ElementContext;
}

function getQueryOptions(
  options: Partial<QuerySelectorOptions> = {},
): QuerySelectorOptions {
  return {
    elCtx: document,
    retryCount: DEFAULT_RETRY_COUNT,
    retryTimeout: DEFAULT_RETRY_TIMEOUT_MS,
    ...options,
  };
}
function queryElementWithRetry<T = null | Node | Node[]>(
  query: () => T,
  {
    retryTimeout,
    retryCount: maxRetryCount,
  }: Pick<QuerySelectorOptions, 'retryCount' | 'retryTimeout'>,
) {
  return new Promise<T | null>((resolve) => {
    function startQuery(retryCount: number) {
      if (retryCount > maxRetryCount) {
        resolve(null);
        return;
      }

      const result = query();
      const retry = Array.isArray(result) ? result.length === 0 : !result;

      if (retry) {
        setTimeout(() => {
          startQuery(retryCount + 1);
        }, retryTimeout);
        return;
      }

      resolve(result);
    }
    startQuery(1);
  });
}
function queryXPath(
  xPath: string,
  multiple?: false,
  elCtx?: ElementContext,
): Element | null;
function queryXPath(
  xPath: string,
  multiple?: true,
  elCtx?: ElementContext,
): Element[];
function queryXPath(
  xPath: string,
  multiple: boolean = false,
  elCtx: ElementContext = document,
): null | Element | Element[] {
  const documentCtx =
    elCtx instanceof Element || elCtx instanceof ShadowRoot
      ? elCtx.ownerDocument
      : elCtx;
  if (!multiple) {
    return documentCtx.evaluate(
      xPath,
      documentCtx,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    ).singleNodeValue as Element | null;
  }

  const xpathResult = documentCtx.evaluate(
    xPath,
    documentCtx,
    null,
    XPathResult.ORDERED_NODE_ITERATOR_TYPE,
    null,
  );

  const elements: Element[] = [];

  let element = xpathResult.iterateNext();
  while (element) {
    elements.push(element as Element);
    element = xpathResult.iterateNext();
  }

  return elements;
}

function selectShadowDom(selector: string, elCtx: ElementContext) {
  if (!selector.includes(CUSTOM_SELECTOR_KEYWORD.SHADOW_DOM))
    return { elCtx, selector };

  const selectors = selector.split(CUSTOM_SELECTOR_KEYWORD.SHADOW_DOM);
  const lastSelector = selectors.pop();

  let currentElCtx = elCtx;

  while (selectors.length) {
    const shadowDomSelector = selectors.shift();
    if (!shadowDomSelector) break;

    const element = QuerySelector.basicQuery(
      shadowDomSelector,
      false,
      currentElCtx,
    );
    if (!element) {
      throw new Error(
        `Couldn't find Shadow DOM with "${shadowDomSelector}" selector`,
      );
    }

    const shadowRoot =
      chrome.dom?.openOrClosedShadowRoot(element as HTMLElement) ||
      element.openOrClosedShadowRoot();
    if (!shadowRoot) {
      throw new Error(
        `Element with "${shadowDomSelector}" selector is not a Shadow DOM`,
      );
    }

    currentElCtx = shadowRoot;
  }

  return { elCtx: currentElCtx, selector: lastSelector! };
}

class QuerySelector {
  static isXPath(selector: string) {
    return selector.startsWith(CUSTOM_SELECTOR_KEYWORD.XPATH);
  }

  static basicQuery(
    selector: string,
    multiple: true,
    elCtx: ElementContext,
  ): Element[];
  static basicQuery(
    selector: string,
    multiple: false,
    elCtx: ElementContext,
  ): Element | null;
  static basicQuery(
    selector: string,
    multiple: boolean = false,
    elCtx: ElementContext = document,
  ): Element | Element[] | null {
    const isXPath = this.isXPath(selector);

    if (multiple) {
      return isXPath
        ? queryXPath(selector, true, elCtx)
        : Array.from(elCtx.querySelectorAll(selector));
    }

    return isXPath
      ? queryXPath(selector, false, elCtx)
      : elCtx.querySelector(selector);
  }

  static getElementContext(selector: string, elCtx: ElementContext = document) {
    const shadowDOM = selectShadowDom(selector, elCtx);
    return shadowDOM;
  }

  static find<T = Element>(
    selector: string,
    options?: Partial<QuerySelectorOptions>,
  ) {
    const { elCtx, retryCount, retryTimeout } = getQueryOptions(options);
    const elementContext = this.getElementContext(selector, elCtx);

    return queryElementWithRetry<T | null>(
      () =>
        this.basicQuery(
          elementContext.selector,
          false,
          elementContext.elCtx,
        ) as T,
      { retryCount, retryTimeout },
    );
  }

  static findAll<T = Element[]>(
    selector: string,
    options?: Partial<QuerySelectorOptions>,
  ) {
    const { elCtx, retryCount, retryTimeout } = getQueryOptions(options);
    const elementContext = this.getElementContext(selector, elCtx);

    return queryElementWithRetry<T>(
      () =>
        this.basicQuery(
          elementContext.selector,
          true,
          elementContext.elCtx,
        ) as T,
      {
        retryCount,
        retryTimeout,
      },
    );
  }
}

export default QuerySelector;
