import type {
  KeyboardShortcutModifier,
  KeyboardShortcut,
  KeyboardShortcutKeys,
} from '@altdot/shared';

const VALID_SHORTCUT_KEYS_REGEX = /[0-9A-Za-z!-/~`{[\]|;:,.?=+<>\\()*$%^&,@_#]/;
const ELECTRON_SHORTCUT_MOD_MAP: Record<KeyboardShortcutModifier, string> = {
  mod: 'CmdOrCtrl',
  altKey: 'Alt',
  metaKey: 'Cmd',
  ctrlKey: 'Ctrl',
  shiftKey: 'Shift',
};

export class KeyboardShortcutUtils {
  static recordShortcut(event: KeyboardEvent): KeyboardShortcut | null {
    if (
      event.repeat ||
      event.key.length > 1 ||
      !VALID_SHORTCUT_KEYS_REGEX.test(event.key)
    )
      return null;

    event.preventDefault();
    event.stopPropagation();

    const modKeys: KeyboardShortcutModifier[] = [];

    if (event.ctrlKey || event.metaKey) modKeys.push('mod');
    if (event.shiftKey) modKeys.push('shiftKey');
    if (event.altKey) modKeys.push('altKey');

    if (modKeys.length === 0) return null;

    return {
      mod1: modKeys[0],
      mod2: modKeys[1],
      key: event.key.toUpperCase() as KeyboardShortcutKeys,
    };
  }

  static createRecorder({
    onChange,
  }: {
    onChange?(
      value:
        | { canceled: true; keys: null }
        | { canceled: false; keys: KeyboardShortcut },
    ): void;
  }) {
    return (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onChange?.({ canceled: true, keys: null });
        return;
      }

      const keys = this.recordShortcut(event);
      if (!keys) return;

      onChange?.({ keys, canceled: false });
    };
  }

  static toString(shortcut: KeyboardShortcut) {
    let keys: string = shortcut.mod1;
    if (shortcut.mod2) keys += `+${shortcut.mod2}`;

    return `${keys}+${shortcut.key}`;
  }

  static toElectronShortcut(shortcut: KeyboardShortcut) {
    let keys: string = ELECTRON_SHORTCUT_MOD_MAP[shortcut.mod1];
    if (shortcut.mod2) keys += `+${ELECTRON_SHORTCUT_MOD_MAP[shortcut.mod2]}`;

    return `${keys}+${shortcut.key}`;
  }
}
