declare enum ExtensionExecutionFinishReason {
    done = 0,
    error = 1,
    timeout = 2
}
interface ExtensionMessagePortEvent {
    'extension:init': [];
    'extension:query-change': [string];
    'extension:keydown-event': [
        Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'altKey' | 'metaKey' | 'isComposing'>
    ];
    'extension:finish-execute': [ExtensionExecutionFinishReason, string?];
}
type ExtensionMessagePortCallback<T extends keyof ExtensionMessagePortEvent> = (...args: ExtensionMessagePortEvent[T]) => void;

export { ExtensionExecutionFinishReason, type ExtensionMessagePortCallback, type ExtensionMessagePortEvent };
