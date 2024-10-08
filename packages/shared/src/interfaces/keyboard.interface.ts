import {
  SHORTCUT_KEYS,
  SHORTCUT_MODIFIER,
} from '../utils/constant/shortcut.const';

export type KeyboardShortcutKeys =
  (typeof SHORTCUT_KEYS)[keyof typeof SHORTCUT_KEYS];

export type KeyboardShortcutModifier =
  (typeof SHORTCUT_MODIFIER)[keyof typeof SHORTCUT_MODIFIER];

export interface KeyboardShortcut {
  key: string;
  mod1: KeyboardShortcutModifier;
  mod2?: KeyboardShortcutModifier;
}

export interface KeyboardBrowserTypeOptions {
  delay: number;
  clearValue: boolean;
}

export type KeyboardModifiers = 'ctrl' | 'shift' | 'alt' | 'meta' | 'cmd';

export interface KeyboardKeyDownOptions {
  text?: string;
  modifiers?: KeyboardModifiers[];
}

export interface KeyboardKeyUpOptions {
  delay?: number;
  modifiers?: KeyboardModifiers[];
}
