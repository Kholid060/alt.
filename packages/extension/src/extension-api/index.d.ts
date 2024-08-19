// GENERATED FILE
import { Browser as ImportedBrowser } from './namespaces/browser';
import { ChildProcess as ImportedChildProcess } from './namespaces/child-process';
import { Clipboard as ImportedClipboard } from './namespaces/clipboard';
import { Command as ImportedCommand } from './namespaces/command';
import { Fs as ImportedFs } from './namespaces/fs';
import { Notifications as ImportedNotifications } from './namespaces/notification';
import { OAuth as ImportedOAuth } from './namespaces/oauth';
import { Runtime as ImportedRuntime } from './namespaces/runtime';
import { Shell as ImportedShell } from './namespaces/shell';
import { Sqlite as ImportedSqlite } from './namespaces/sqlite';
import { Storage as ImportedStorage } from './namespaces/storage';
import { UI as ImportedUI } from './namespaces/ui';

declare namespace ExtensionAPI {
  const browser: Browser.Static;
  const childProcess: ChildProcess.Static;
  const clipboard: Clipboard.Static;
  const command: Command.Static;
  const fs: Fs.Static;
  const notifications: Notifications.Static;
  const oAuth: OAuth.Static;
  const runtime: Runtime.Static;
  const shell: Shell.Static;
  const sqlite: Sqlite.Static;
  const storage: Storage.Static;
  const ui: UI.Static;

  export import Browser = ImportedBrowser;
  export import ChildProcess = ImportedChildProcess;
  export import Clipboard = ImportedClipboard;
  export import Command = ImportedCommand;
  export import Fs = ImportedFs;
  export import Notifications = ImportedNotifications;
  export import OAuth = ImportedOAuth;
  export import Runtime = ImportedRuntime;
  export import Shell = ImportedShell;
  export import Sqlite = ImportedSqlite;
  export import Storage = ImportedStorage;
  export import UI = ImportedUI;
}

export { ExtensionAPI, ExtensionAPI as _extension };
