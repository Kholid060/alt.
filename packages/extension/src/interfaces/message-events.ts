export enum ExtensionExecutionFinishReason {
  done,
  error,
  timeout,
}

export interface ExtensionMessagePortEvent {
  'extension:init': [];
  'extension:reload': [];
  'extension:query-change': [string];
  'extension:keydown-event': [
    Pick<
      KeyboardEvent,
      'key' | 'ctrlKey' | 'altKey' | 'metaKey' | 'isComposing'
    >,
  ];
  'extension:finish-execute': [ExtensionExecutionFinishReason, string?];
}

export type ExtensionMessagePortCallback<
  T extends keyof ExtensionMessagePortEvent,
> = (...args: ExtensionMessagePortEvent[T]) => void;
