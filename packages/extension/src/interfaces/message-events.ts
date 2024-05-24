import ExtensionAPI from '@repo/extension-core/types/extension-api';

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
    KeydownEvent: ExtensionAPI.ui.searchPanel.KeydownEvent,
  ];
  'extension:show-toast': [
    toastId: string,
    options: Required<ExtensionAPI.ui.ToastOptions>,
  ];
  'extension:query-clear-value': [];
  'extension:hide-toast': [toastId: string];
  'extension:finish-execute': [ExtensionExecutionFinishReason, string?];
}

export type ExtensionMessagePortCallback<
  T extends keyof ExtensionMessagePortEvent,
> = (...args: ExtensionMessagePortEvent[T]) => void;
