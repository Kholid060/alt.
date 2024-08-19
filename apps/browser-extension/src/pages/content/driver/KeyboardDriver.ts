import { SetRequired } from 'type-fest';
import * as elementUtils from '../../../utils/elements-utils';
import * as selectionUtils from '../../../utils/selection-utils';
import {
  KeyboardBrowserTypeOptions,
  USKeyboard,
  USKeyboardDetail,
  sleep,
} from '@altdot/shared';
import { ExtensionAPI } from '@altdot/extension';

function getModifierEventData(
  mods: ExtensionAPI.Browser.Tabs.KeyboardModifiers[],
) {
  const modsData: Pick<
    KeyboardEventInit,
    'altKey' | 'shiftKey' | 'metaKey' | 'ctrlKey'
  > = {
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
  };

  mods.forEach((mod) => {
    switch (mod) {
      case 'alt':
        modsData.altKey = true;
        break;
      case 'ctrl':
        modsData.ctrlKey = true;
        break;
      case 'cmd':
      case 'meta':
        modsData.metaKey = true;
        break;
      case 'shift':
        modsData.shiftKey = true;
        break;
    }
  });

  return modsData;
}

function getKeyDetail(
  key: string,
): SetRequired<USKeyboardDetail, 'code' | 'text' | 'keyCode'> {
  return {
    code: '',
    text: '',
    keyCode: 0,
    location: 0,
    ...(USKeyboard[key] ?? {}),
  };
}

type KeyboardEventInitData = KeyboardEventInit & {
  text: string;
  realKey: string;
};
function getKeyboardEventInit(
  key: string,
  modifiers: ExtensionAPI.Browser.Tabs.KeyboardModifiers[] = [],
): KeyboardEventInitData {
  const modsData = getModifierEventData(modifiers);
  const keyDetail = getKeyDetail(key);

  return {
    ...modsData,
    realKey: key,
    bubbles: true,
    cancelable: true,
    code: keyDetail.code,
    keyCode: keyDetail.keyCode,
    key:
      keyDetail.shiftKey && modsData.shiftKey
        ? keyDetail.shiftKey
        : keyDetail.key,
    view: window,
    text: keyDetail.text,
    location: keyDetail.location,
  };
}

type DefaultKeyAction = (el: Element) => boolean;
const defaultKeyActions: Record<string, DefaultKeyAction> = {
  Enter: (el) => {
    if (elementUtils.isInput(el)) {
      el.form?.requestSubmit(el);
      return false;
    }

    return selectionUtils.replaceSelection(el, '\n');
  },
  ArrowLeft: (el) => {
    selectionUtils.moveSelection('left', el);
    return false;
  },
  ArrowRight: (el) => {
    selectionUtils.moveSelection('right', el);
    return false;
  },
  ArrowUp: (el) => {
    selectionUtils.moveSelection('up', el);
    return false;
  },
  ArrowDown: (el) => {
    selectionUtils.moveSelection('down', el);
    return false;
  },
  Home: (el) => {
    selectionUtils.moveSelection('start', el);
    return false;
  },
  End: (el) => {
    selectionUtils.moveSelection('end', el);
    return false;
  },
  Backspace: (el) => {
    return selectionUtils.deleteByCursorPos('left', el);
  },
  Delete: (el) => {
    return selectionUtils.deleteByCursorPos('right', el);
  },
};

function getInputEventType(
  {
    ctrlKey,
    key,
    shiftKey,
  }: Pick<KeyboardEventInitData, 'key' | 'ctrlKey' | 'shiftKey'>,
  isContentEditable = false,
) {
  switch (key) {
    case 'Enter':
      return isContentEditable ? 'insertParagraph' : 'insertLineBreak';
    case 'Backspace': {
      if (ctrlKey && shiftKey) return 'deleteHardLineBackward';
      if (ctrlKey) return 'deleteWordBackward';

      return 'deleteContentBackward';
    }
    case 'Delete': {
      if (ctrlKey && shiftKey) return 'deleteHardLineForward';
      if (ctrlKey) return 'deleteWordForward';

      return 'deleteContentForward';
    }
  }

  return 'insertText';
}

interface TypeCharOptions {
  modifiers: ExtensionAPI.Browser.Tabs.KeyboardModifiers[];
}

interface KeyEventDetail {
  el: Element;
  modifiers?: ExtensionAPI.Browser.Tabs.KeyboardModifiers[];
  key: string | KeyboardEventInitData;
}

const DEFAULT_KEYBOARD_DELAY_MS = 100;

class KeyboardDriver {
  private static _fireKeyboardEvent(
    eventName: 'keydown' | 'keyup',
    { el, key, modifiers }: KeyEventDetail,
  ) {
    const eventData =
      typeof key === 'string' ? getKeyboardEventInit(key, modifiers) : key;
    const keyboardEvent = new KeyboardEvent(eventName, eventData);

    return { dispatched: el.dispatchEvent(keyboardEvent), eventData };
  }

  static keyDown(detail: KeyEventDetail & { text?: string }) {
    const { dispatched, eventData } = this._fireKeyboardEvent(
      'keydown',
      detail,
    );
    if (!dispatched) return false;

    let triggerInputEvent = false;

    const keyAction = defaultKeyActions[eventData.key || ''];
    if (keyAction) {
      triggerInputEvent = keyAction(detail.el);
    } else {
      triggerInputEvent = selectionUtils.replaceSelection(
        detail.el,
        detail.text || eventData.realKey,
      );
    }

    if (triggerInputEvent) {
      const inputType = getInputEventType(
        eventData,
        elementUtils.isContentEditable(detail.el),
      );
      const inputEvent = new InputEvent('input', {
        inputType,
        view: window,
        bubbles: true,
        cancelable: true,
        data: eventData.realKey,
      });

      return detail.el.dispatchEvent(inputEvent);
    }

    return true;
  }

  static keyUp(detail: KeyEventDetail) {
    return this._fireKeyboardEvent('keyup', detail).dispatched;
  }

  static sendKey(
    el: Element,
    key: string,
    { modifiers = [] }: Partial<TypeCharOptions> = {},
  ) {
    const keyboardEventData = getKeyboardEventInit(key, modifiers);

    const toNextEvent = this.keyDown({ el, key: keyboardEventData });
    if (toNextEvent) this.keyUp({ el, key: keyboardEventData });
  }

  static async type(
    el: Element,
    text: string,
    options: Partial<KeyboardBrowserTypeOptions> = {},
  ) {
    const typeOptions: KeyboardBrowserTypeOptions = {
      clearValue: false,
      delay: DEFAULT_KEYBOARD_DELAY_MS,
      ...options,
    };

    if (el instanceof HTMLElement) el.focus();

    if (typeOptions.clearValue) {
      const isContentSelected = selectionUtils.selectAll(el);
      if (isContentSelected) {
        selectionUtils.replaceSelection(el, '');
      }
    }

    if (typeOptions.delay === 0) {
      const triggerInputEvent = selectionUtils.replaceSelection(el, text);
      if (triggerInputEvent) {
        const inputEvent = new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertFromPaste',
        });
        el.dispatchEvent(inputEvent);
      }

      return;
    }

    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      this.sendKey(el, char);

      await sleep(typeOptions.delay);
    }
  }
}

export default KeyboardDriver;
