import { finder } from '@medv/finder';
import ExtensionAPI from '@repo/extension-core/types/extension-api';
import { debounce } from '@repo/shared';
import Browser from 'webextension-polyfill';

const ELEMENT_IDS = {
  style: 'alt-dot__element-selector',
  overlay: 'alt-dot__element-selector--overlay',
  cardContainer: 'alt-dot__element-selector--card',
  highlighter: 'alt-dot__element-selector--highlighter',
};
const HIGHLIGHTED_EL_ATTR_NAME = 'alt-dot__selected';

interface CreateElementOptions {
  appendChild?: boolean;
  appendRoot?: HTMLElement | ShadowRoot;
}
function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  attrs?: Record<'$content' | string, string>,
  {
    appendChild,
    appendRoot = document.documentElement,
  }: CreateElementOptions = {},
) {
  const el = document.createElement(tagName);
  Object.entries(attrs ?? {}).forEach(([name, value]) => {
    if (name === '$content') {
      el.textContent = value;
      return;
    }

    el.setAttribute(name, value);
  });

  if (appendChild) appendRoot.appendChild(el);

  return el;
}

function injectStyle() {
  const styleEl = document.createElement('style');
  styleEl.id = ELEMENT_IDS.style;
  styleEl.textContent = `
    #${ELEMENT_IDS.overlay} {
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      position: fixed;
      z-index: 9999998;
    }
    #${ELEMENT_IDS.cardContainer} {
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      position: fixed;
      z-index: 9999999;
      pointer-events: none;
    }
    #${ELEMENT_IDS.highlighter} {
      top: 0;
      left: 0;
      position: fixed;
      z-index: 9999998;
      pointer-events: none;
      border: 2px solid rgb(229 77 46);
      background-color: rgba(229, 77, 46, 0.15);
    }

    [${HIGHLIGHTED_EL_ATTR_NAME}] {
      outline: 2px solid #E54D2E;
    }
  `;
  document.body.appendChild(styleEl);

  return styleEl;
}
function createCardElement({
  title,
  description,
  containerEl,
}: {
  title?: string;
  description?: string;
  containerEl: Element;
}) {
  containerEl.attachShadow({ mode: 'open' });

  const shadowRoot = containerEl.shadowRoot!;

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    :host {
      font-size: 14px;
      color: rgb(238 238 240);
      font-family: Inter, sans-serif;
    }

    #card {
      gap: 8px;
      left: 50%;
      bottom: 5px;
      display: flex;
      max-width: 250px;
      padding: 10px 12px;
      position: absolute;
      border-radius: 8px;
      align-items: center;
      backdrop-filter: blur(4px);
      transform: translateX(-50%);
      background-color: rgba(18, 17, 19, 0.8);
      border: 1px solid  rgb(73 71 78);
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
    }

    #description {
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      color: rgb(181 178 188);
      -webkit-box-orient: vertical;
    }

    @font-face {
      font-display: swap;
      font-family: 'Inter';
      font-style: normal;
      font-weight: 100 900;
      src: url('${Browser.runtime.getURL('/fonts/InterVariable.woff2')}') format('woff2');
    }
  `;
  shadowRoot.appendChild(styleEl);

  const cardEl = createElement(
    'div',
    { id: 'card' },
    {
      appendChild: true,
      appendRoot: shadowRoot,
    },
  );

  createElement(
    'img',
    {
      width: '26',
      height: '26',
      id: 'app-logo',
      src: Browser.runtime.getURL('icon-128.png'),
    },
    {
      appendChild: true,
      appendRoot: cardEl,
    },
  );

  const textContainer = createElement(
    'div',
    {
      id: 'text-container',
    },
    {
      appendChild: true,
      appendRoot: cardEl,
    },
  );
  createElement(
    'div',
    { $content: title || 'Select an element', id: 'title' },
    {
      appendChild: true,
      appendRoot: textContainer,
    },
  );
  if (description) {
    createElement(
      'div',
      { $content: description, id: 'description', title: description },
      {
        appendChild: true,
        appendRoot: textContainer,
      },
    );
  }
}

export interface SelectElementResult {
  selector: string;
  canceled: boolean;
}

class ElementSelector {
  private styleEl: HTMLStyleElement;
  private overlayEl: HTMLDivElement;
  private highlightEl: HTMLDivElement;

  private prevSelectedEl: Element | null = null;

  private resolverFunc: ((value: SelectElementResult) => void) | null = null;

  filter?: ExtensionAPI.browser.activeTab.SelectElementFilter;

  constructor({
    title,
    filter,
    description,
  }: ExtensionAPI.browser.activeTab.SelectElementOptions = {}) {
    this.filter = filter;

    this.styleEl = injectStyle();
    this.overlayEl = createElement(
      'div',
      { id: ELEMENT_IDS.overlay },
      { appendChild: true },
    );
    this.highlightEl = createElement(
      'div',
      { id: ELEMENT_IDS.highlighter },
      { appendChild: true },
    );

    createCardElement({ containerEl: this.overlayEl, description, title });

    this._keyDownHandler = this._keyDownHandler.bind(this);
    this._mouseDownHandler = this._mouseDownHandler.bind(this);
    this._mouseMoveHandler = this._mouseMoveHandler.bind(this);
    this._scrollHandler = debounce(this._scrollHandler.bind(this), 125);
    this._visibilityChangeHandler = this._visibilityChangeHandler.bind(this);

    this._initEventListener();
  }

  private _initEventListener() {
    window.addEventListener('scroll', this._scrollHandler);
    window.addEventListener('keydown', this._keyDownHandler);
    window.addEventListener('mousemove', this._mouseMoveHandler);
    window.addEventListener('mousedown', this._mouseDownHandler);
    document.addEventListener(
      'visibilitychange',
      this._visibilityChangeHandler,
    );
  }

  private _mouseMoveHandler({ clientX, clientY }: MouseEvent) {
    let { 1: target } = document.elementsFromPoint(clientX, clientY);

    if (target.shadowRoot) {
      target = target.shadowRoot.elementsFromPoint(clientX, clientY)[1];
    }

    if (target === this.prevSelectedEl) return;

    this.selectElement(target);
  }

  private _visibilityChangeHandler() {
    if (document.visibilityState === 'hidden' && this.resolverFunc) {
      this.resolverFunc({ canceled: true, selector: '' });
    }
  }

  private _scrollHandler() {
    if (!this.prevSelectedEl) return;

    this.selectElement(this.prevSelectedEl);
  }

  private selectElement(element: Element) {
    const { x, y, height, width } = element.getBoundingClientRect();
    this.highlightEl.style.height = height + 'px';
    this.highlightEl.style.width = width + 'px';
    this.highlightEl.style.transform = `translate(${x}px, ${y}px)`;

    this.prevSelectedEl = element;
  }

  private _mouseDownHandler() {
    if (!this.prevSelectedEl || !this.resolverFunc) return;

    if (this.filter?.selector) {
      const isMatchFilter = this.prevSelectedEl.matches(this.filter.selector);
      if (!isMatchFilter) {
        alert('This element does not match the filter');
        return;
      }
    }

    let selector = finder(this.prevSelectedEl);

    const elementRoot = this.prevSelectedEl.getRootNode();
    if (elementRoot instanceof ShadowRoot) {
      selector = `${finder(elementRoot.host)} >> ${selector}`;
    }

    this.resolverFunc({ canceled: false, selector });
    this.destroy();
  }

  private _keyDownHandler({ key }: KeyboardEvent) {
    if (key !== 'Escape' || !this.resolverFunc) return;

    this.resolverFunc({ canceled: true, selector: '' });
    this.destroy();
  }

  start(): Promise<SelectElementResult> {
    return new Promise((resolve, reject) => {
      if (this.resolverFunc) {
        reject(new Error('Element Selector already started'));
        return;
      }

      this._initEventListener();
      this.resolverFunc = resolve;
    });
  }

  cancel() {
    if (this.resolverFunc) {
      this.resolverFunc({ canceled: true, selector: '' });
    }

    this.destroy();
  }

  destroy() {
    this.styleEl.remove();
    this.overlayEl.remove();
    this.highlightEl.remove();
    this.prevSelectedEl?.removeAttribute(HIGHLIGHTED_EL_ATTR_NAME);

    window.removeEventListener('scroll', this._scrollHandler);
    window.removeEventListener('keydown', this._keyDownHandler);
    window.removeEventListener('mousemove', this._mouseMoveHandler);
    window.removeEventListener('mousedown', this._mouseDownHandler);
    document.removeEventListener(
      'visibilitychange',
      this._visibilityChangeHandler,
    );

    this.filter = undefined;
  }
}

export default ElementSelector;
