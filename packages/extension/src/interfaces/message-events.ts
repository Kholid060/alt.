import { ExtensionAPI } from '../extension-api';

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
  'extension:show-toast': [
    toastId: string,
    options: Required<ExtensionAPI.UI.ToastOptions>,
  ];
  'extension:query-clear-value': [];
  'extension:hide-toast': [toastId: string];
  'extension:query-update-placeholder': [placeholder: string];
  'extension:finish-execute': [ExtensionExecutionFinishReason, string?];
}

export type ExtensionMessagePortCallback<
  T extends keyof ExtensionMessagePortEvent,
> = (...args: ExtensionMessagePortEvent[T]) => void;
