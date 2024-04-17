export const COMMAND_INPUT_VALUE_KEY = Symbol('command-input-value');

export const IS_MAC_OS = navigator.userAgent.indexOf('Mac OS X') !== -1;

export const COMMAND_MOD_NAME_MAP: Record<string, string> = {
  CmdOrCtrl: IS_MAC_OS ? '⌘' : 'Ctrl',
} as const;
