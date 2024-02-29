interface ExtensionMessagePortEvent {
    'extension:init': [];
    'extension:query-change': [string];
    'extension:keydown-event': [
        Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'altKey' | 'metaKey' | 'isComposing'>
    ];
    'extension:finish-execute': [];
}
type ExtensionMessagePortCallback<T extends keyof ExtensionMessagePortEvent> = (...args: ExtensionMessagePortEvent[T]) => void;

export type { ExtensionMessagePortCallback, ExtensionMessagePortEvent };
