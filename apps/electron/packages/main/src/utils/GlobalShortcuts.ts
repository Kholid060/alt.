import { app, globalShortcut } from 'electron';

type GlobalShortcutCallback = (shortcut: string, id?: string) => void;
interface GlobalShortcutItem {
  id?: string;
  keys: string;
  callback: GlobalShortcutCallback;
}

class GlobalShortcut {
  private static _instance: GlobalShortcut | null = null;
  static get instance() {
    return this._instance || (this._instance = new GlobalShortcut());
  }

  private registerQueue: GlobalShortcutItem[] = [];
  private shortcuts: Record<string, GlobalShortcutItem[]> = {};

  constructor() {}

  private shortcutListener(keys: string) {
    const items = this.shortcuts[keys];
    if (!items || items.length === 0) return;

    items.forEach((item) => item.callback(keys, item.id));
  }

  init() {
    if (this.registerQueue.length === 0) return;

    this.registerQueue.forEach((item) => this.register(item));
    this.registerQueue = [];
  }

  register({ id, keys, callback }: GlobalShortcutItem) {
    if (!app.isReady()) {
      this.registerQueue.push({ id, keys, callback });
      return;
    }

    if (!this.shortcuts[keys]) this.shortcuts[keys] = [];

    this.shortcuts[keys].push({ callback, keys, id });
    if (globalShortcut.isRegistered(keys)) return;

    globalShortcut.register(keys, () => {
      this.shortcutListener(keys);
    });
  }

  unregister(keys: string, ids?: string[]) {
    const items = this.shortcuts[keys];
    if (!items) return;

    let unregisterShortcut = !ids;

    if (ids && ids.length > 0) {
      items.forEach((item, index) => {
        if (!item.id || !ids.includes(item.id)) return;

        this.shortcuts[keys].splice(index, 1);
      });
      unregisterShortcut = this.shortcuts[keys].length === 0;
    }

    if (unregisterShortcut) {
      globalShortcut.unregister(keys);
    }
  }

  unregisterById(id: string) {
    Object.keys(this.shortcuts).forEach((key) => {
      this.shortcuts[key] = this.shortcuts[key].filter(
        (item) => item.id !== id,
      );

      if (this.shortcuts[key].length === 0) {
        globalShortcut.unregister(key);
      }
    });
  }

  isKeysRegistered(keys: string) {
    return Object.hasOwn(this.shortcuts, keys);
  }

  getById(id: string, keys?: string) {
    if (keys) {
      return this.shortcuts[keys]?.find((item) => item.id == id) ?? null;
    }

    return (
      Object.values(this.shortcuts)
        .flat()
        .find((item) => item.id == id) ?? null
    );
  }
}

export default GlobalShortcut;
