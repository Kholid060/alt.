import { globalShortcut } from 'electron';
import { GLOBAL_SHORTCUTS } from './constant';
import { toggleCommandWindow } from '../window/command-window';
import { logger } from '../lib/log';
import extensionCommandRunner from './extension/extensionCommandRunner';
import { CommandLaunchBy } from '@repo/extension';
import extensionsDB from '../db/extension.db';

class GlobalShortcut {
  private static _instance: GlobalShortcut | null = null;

  static get instance() {
    if (!this._instance) {
      this._instance = new GlobalShortcut();
    }

    return this._instance;
  }

  private _shortcuts: Map<string, { metadata?: unknown; keys: string }> =
    new Map();

  constructor() {}

  get shortcuts() {
    return [...this._shortcuts.values()];
  }

  register(
    keys: string,
    callback: (keys: string, metadata?: unknown) => void,
    metadata?: unknown,
  ) {
    if (this._shortcuts.has(keys)) {
      throw new Error(`"${keys}" shortcut is already registered`);
    }

    globalShortcut.register(keys, () => {
      callback(keys, metadata);
    });
    this._shortcuts.set(keys, { keys, metadata });
  }

  unregister(keys: string | string[]) {
    const keysArr = Array.isArray(keys) ? keys : [keys];

    keysArr.forEach((item) => {
      globalShortcut.unregister(item);
      this._shortcuts.delete(item);
    });
  }
}

export class GlobalShortcutExtension {
  static toggleShortcut(
    extensionId: string,
    commandId: string,
    keys: string | null,
  ) {
    const metadata = `${extensionId}:${commandId}`;

    const registeredShorcut = GlobalShortcut.instance.shortcuts.find(
      (shortcut) => shortcut.metadata === metadata,
    );
    if (registeredShorcut) {
      GlobalShortcut.instance.unregister(registeredShorcut.keys);
    }

    if (!keys) return;

    GlobalShortcut.instance.register(
      keys,
      async () => {
        try {
          await extensionCommandRunner({
            commandId,
            extensionId,
            launchContext: {
              args: {},
              launchBy: CommandLaunchBy.USER,
            },
          });
        } catch (error) {
          logger(
            'error',
            ['globalShorcut', 'extension-command-shortcut'],
            error,
          );
        }
      },
      metadata,
    );
  }

  static async registerAllShortcuts() {
    const commands = await extensionsDB.query.commands.findMany({
      columns: {
        name: true,
        shortcut: true,
      },
      with: {
        extension: { columns: { id: true } },
      },
      where(fields, operators) {
        return operators.isNotNull(fields.shortcut);
      },
    });
    commands.map((command) => {
      if (!command.extension) return;

      this.toggleShortcut(command.extension.id, command.name, command.shortcut);
    });
  }
}

export async function registerGlobalShortcuts() {
  try {
    GlobalShortcut.instance.register(
      GLOBAL_SHORTCUTS.toggleCommandWindow,
      () => {
        toggleCommandWindow();
      },
    );
    await GlobalShortcutExtension.registerAllShortcuts();
  } catch (error) {
    logger('error', ['globalShorcut', 'registerGlobalShortcuts'], error);
  }
}

export default GlobalShortcut;
