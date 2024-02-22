export interface ExtensionMessagePortEvent {
  'extension:init': [];
  'extension:query-change': [string];
}

export type MessagePortEvent = ExtensionMessagePortEvent;
