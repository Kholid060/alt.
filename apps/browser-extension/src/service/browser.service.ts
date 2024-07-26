import { debounce } from '@altdot/shared';
import Browser from 'webextension-polyfill';

class BrowserService {
  private static _instance: BrowserService | null = null;
  static get instance() {
    return this._instance || (this._instance = new BrowserService());
  }

  private _focusedWindowId: number = -1;

  constructor() {
    this.onWindowsFocusChanged = debounce(
      this.onWindowsFocusChanged.bind(this),
      250,
    );
  }

  get isFocused() {
    return this._focusedWindowId !== Browser.windows.WINDOW_ID_NONE;
  }

  get focusedWindowId() {
    return this._focusedWindowId;
  }

  async startListener() {
    Browser.windows.onFocusChanged.addListener(this.onWindowsFocusChanged);
    Browser.windows.getCurrent().then((currentWindow) => {
      this._focusedWindowId = currentWindow.id ?? -1;
    });
  }

  stopListener() {
    Browser.windows.onFocusChanged.removeListener(this.onWindowsFocusChanged);
    this._focusedWindowId = -1;
  }

  private onWindowsFocusChanged(windowId: number) {
    this._focusedWindowId = windowId;
  }
}

export default BrowserService;
