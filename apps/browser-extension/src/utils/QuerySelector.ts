const CUSTOM_SELECTOR_KEYWORD = {
  XPATH: '::xpath=',
};

const DEFAULT_RETRY_COUNT = 5;
const DEFAULT_RETRY_TIMEOUT_MS = 1000; // 1 seconds;

interface QuerySelectorOptions {
  retryCount: number;
  retryTimeout: number;
  elCtx: Document | Element;
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
function queryElementWithRetry<T extends null | Node | Node[]>(
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
      console.log({ result, retry });
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

class QuerySelector {
  static isXPath(selector: string) {
    return selector.startsWith(CUSTOM_SELECTOR_KEYWORD.XPATH);
  }

  static find(selector: string, options?: Partial<QuerySelectorOptions>) {
    const { elCtx, retryCount, retryTimeout } = getQueryOptions(options);
    const isXPath = this.isXPath(selector);

    return queryElementWithRetry(
      () => {
        let element: Element | null = null;

        if (isXPath) {
          element = document.evaluate(
            selector,
            elCtx,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null,
          ).singleNodeValue as Element;
        } else {
          element = elCtx.querySelector(selector);
        }

        console.log(element, selector);

        return element;
      },
      { retryCount, retryTimeout },
    );
  }

  static findAll(selector: string, options?: Partial<QuerySelectorOptions>) {
    const { elCtx, retryCount, retryTimeout } = getQueryOptions(options);
    const isXPath = this.isXPath(selector);

    return queryElementWithRetry(
      () => {
        let elements: Element[] = [];

        if (isXPath) {
          const xpathResult = document.evaluate(
            selector,
            elCtx,
            null,
            XPathResult.ORDERED_NODE_ITERATOR_TYPE,
            null,
          );

          let element = xpathResult.iterateNext();
          while (element) {
            elements.push(element as Element);
            element = xpathResult.iterateNext();
          }
        } else {
          elements = Array.from(elCtx.querySelectorAll(selector));
        }

        return elements;
      },
      { retryCount, retryTimeout },
    );
  }
}

export default QuerySelector;
