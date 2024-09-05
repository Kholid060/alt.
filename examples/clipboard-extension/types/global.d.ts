interface ExtensionViewActionSyncEvent {
  hola: [test: number]
}

interface ExtensionViewActionAsyncEvent {
  'test': () => boolean;
}
