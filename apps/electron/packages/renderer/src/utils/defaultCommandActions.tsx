import { ExtensionDataValid } from '#common/interface/extension.interface';
import { CommandActions } from '@repo/extension';
import {
  CopyIcon,
  GlobeIcon,
  LucideIcon,
  Trash2Icon,
  ClipboardPaste,
  FolderOpenIcon,
} from 'lucide-react';
import preloadAPI from './preloadAPI';
import { IPCEventError } from '#common/interface/ipc-events.interface';
import { CommandPanelStoreActions } from '../stores/command-panel.store';
import { isIPCEventError } from '#common/utils/helper';

function resultHandler(
  {
    result,
    addStatus,
  }: {
    result: unknown | IPCEventError;
    addStatus: CommandPanelStoreActions['addStatus'];
  },
  callback?: () => void,
) {
  if (isIPCEventError(result)) {
    addStatus({
      type: 'error',
      title: 'Error',
      description: result.message,
    });
    return;
  }

  callback?.();
}

const defaultCommandActions: {
  [T in CommandActions['type']]: {
    id: T;
    title: string;
    icon: LucideIcon;
    onAction(
      detail: {
        commandId: string;
        extension: ExtensionDataValid & { $key: string };
        addStatus: CommandPanelStoreActions['addStatus'];
      },
      data: Extract<CommandActions, { type: T }>,
    ): void;
  };
} = {
  copy: {
    id: 'copy',
    icon: CopyIcon,
    title: 'Copy to Clipboard',
    onAction({ extension, commandId, addStatus }, data) {
      preloadAPI.main
        .invokeIpcMessage('user-extension', {
          commandId,
          key: extension.$key,
          name: 'clipboard.write',
          args: ['text', data.content],
        })
        .then((result) => {
          console.log(result, data);
          resultHandler({ addStatus, result }, () => {
            addStatus({
              type: 'success',
              title: 'Copied to clipboard',
            });
          });
        });
    },
  },
  paste: {
    id: 'paste',
    icon: ClipboardPaste,
    title: 'Paste Content',
    onAction({ extension, commandId, addStatus }, data) {
      preloadAPI.main
        .invokeIpcMessage('user-extension', {
          commandId,
          key: extension.$key,
          name: 'clipboard.paste',
          args: [data.content],
        })
        .then((result) => {
          resultHandler({ addStatus, result });
        });
    },
  },
  'open-url': {
    id: 'open-url',
    icon: GlobeIcon,
    title: 'Open in Browser',
    onAction({ extension, commandId, addStatus }, data) {
      preloadAPI.main
        .invokeIpcMessage('user-extension', {
          commandId,
          key: extension.$key,
          name: 'shell.openURL',
          args: [data.url],
        })
        .then((result) => {
          resultHandler({ addStatus, result });
        });
    },
  },
  'show-in-folder': {
    icon: FolderOpenIcon,
    id: 'show-in-folder',
    title: 'Show in Folder',
    onAction({ extension, commandId, addStatus }, data) {
      preloadAPI.main
        .invokeIpcMessage('user-extension', {
          commandId,
          key: extension.$key,
          name: 'shell.showItemInFolder',
          args: [data.path],
        })
        .then((result) => {
          resultHandler({ addStatus, result });
        });
    },
  },
  'move-to-trash': {
    icon: Trash2Icon,
    id: 'move-to-trash',
    title: 'Show in Folder',
    onAction({ extension, commandId, addStatus }, data) {
      preloadAPI.main
        .invokeIpcMessage('user-extension', {
          commandId,
          key: extension.$key,
          name: 'shell.moveToTrash',
          args: [data.path],
        })
        .then((result) => {
          resultHandler({ addStatus, result });
        });
    },
  },
};

export default defaultCommandActions;
