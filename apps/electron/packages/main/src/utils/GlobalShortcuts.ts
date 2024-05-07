import { globalShortcut } from 'electron';
import { GLOBAL_SHORTCUTS } from './constant';
import { logger } from '../lib/log';
import { CommandLaunchBy } from '@repo/extension';
import DBService from '../services/database/database.service';
import WindowCommand from '../window/command-window';
import SharedProcessService from '../services/shared-process.service';

type GlobalShortcutCallback = (shortcut: string, id?: string) => void;
interface GlobalShortcutItem {
  id?: string;
  keys: string;
  callback: GlobalShortcutCallback;
}

class GlobalShortcut {
  private static _instance: GlobalShortcut | null = null;

  static get instance() {
    if (!this._instance) {
      this._instance = new GlobalShortcut();
    }

    return this._instance;
  }

  private shortcuts: Record<string, GlobalShortcutItem[]> = {};

  constructor() {}

  private shortcutListener(keys: string) {
    const items = this.shortcuts[keys];
    if (!items || items.length === 0) return;

    items.forEach((item) => item.callback(keys, item.id));
  }

  register({
    id,
    keys,
    callback,
  }: {
    id?: string;
    keys: string;
    callback: GlobalShortcutCallback;
  }) {
    if (!this.shortcuts[keys]) this.shortcuts[keys] = [];

    this.shortcuts[keys].push({ callback, keys, id });
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
    });
  }

  isKeysRegistered(keys: string) {
    return Object.hasOwn(this.shortcuts, keys);
  }
}

export class GlobalShortcutExtension {
  static toggleShortcut(
    extensionId: string,
    commandId: string,
    keys: string | null,
  ) {
    const shortcutId = `${extensionId}:${commandId}`;
    GlobalShortcut.instance.unregisterById(shortcutId);

    if (!keys) return;

    GlobalShortcut.instance.register({
      keys,
      callback: async () => {
        try {
          await SharedProcessService.executeExtensionCommand({
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
      id: shortcutId,
    });
  }

  static async registerAllShortcuts() {
    const commands = await DBService.instance.db.query.commands.findMany({
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
    GlobalShortcut.instance.register({
      keys: GLOBAL_SHORTCUTS.toggleCommandWindow,
      callback: () => {
        WindowCommand.instance.toggleWindow();
      },
    });
    await GlobalShortcutExtension.registerAllShortcuts();
  } catch (error) {
    logger('error', ['globalShorcut', 'registerGlobalShortcuts'], error);
  }
}

export default GlobalShortcut;
