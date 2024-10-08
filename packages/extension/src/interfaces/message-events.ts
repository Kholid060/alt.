import type { ExtensionAPI } from '../extension-api';

export enum ExtensionExecutionFinishReason {
  done,
  error,
  timeout,
}

export interface ExtensionMessagePortEvent {
  'extension:init': [];
  'extension:reload': [];
  'extension:query-change': [query: string];
  'extension:keydown-event': [
    KeydownEvent: ExtensionAPI.UI.SearchPanel.KeydownEvent,
  ];
  'app:theme-changed': [theme: 'light' | 'dark' | 'system'];
  'extension:show-toast': [
    toastId: string,
    options: Required<ExtensionAPI.UI.ToastOptions>,
  ];
  'extension:navigation-pop': [];
  'extension:query-clear-value': [];
  'extension:hide-toast': [toastId: string];
  'extension:navigation-toggle-root-lock': [lock: boolean];
  'extension:query-update-placeholder': [placeholder: string];
  'extension:finish-execute': [ExtensionExecutionFinishReason, string?];
}

export interface ExtensionMessagePortEventAsync {
  'extension:show-confirm-alert': (
    options: ExtensionAPI.UI.Alert.ConfirmOptions,
  ) => boolean;
}

export type ExtensionMessagePortCallback<
  T extends keyof ExtensionMessagePortEvent,
> = (...args: ExtensionMessagePortEvent[T]) => void;
