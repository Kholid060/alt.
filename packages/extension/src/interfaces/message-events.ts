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
  'extension:finish-execute': [ExtensionExecutionFinishReason, string?];
}

export type ExtensionMessagePortCallback<
  T extends keyof ExtensionMessagePortEvent,
> = (...args: ExtensionMessagePortEvent[T]) => void;
