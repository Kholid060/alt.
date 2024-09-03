declare namespace ExtensionAPI {
  namespace ViewAction {
    interface SyncEvent {}
    interface AsyncEvent {
      'test': () => void;
    }
  }
}
