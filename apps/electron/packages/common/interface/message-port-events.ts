export interface ExtensionMessagePortEvent {
  'extension:init': [];
  'extension:query-change': [string];
  'extension:keydown-event': [Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'altKey' | 'metaKey' | 'isComposing'>];
}

export type MessagePortEvent = ExtensionMessagePortEvent;

export type MessagePortCallback<T extends keyof MessagePortEvent> = (...args: MessagePortEvent[T]) => void;
