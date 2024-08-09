import {
  CopyIcon,
  GlobeIcon,
  LucideIcon,
  ClipboardPaste,
  FolderOpenIcon,
} from 'lucide-react';
import preloadAPI from './preloadAPI';
import { IPCEventError } from '#common/interface/ipc-events.interface';
import { CommandPanelStoreActions } from '../stores/command-panel.store';
import { isIPCEventError } from './helper';
import { CommandJSONAction } from '@altdot/extension';

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
  [T in CommandJSONAction['type']]: {
    id: T;
    title: string;
    icon: LucideIcon;
    onAction(
      detail: {
        addStatus: CommandPanelStoreActions['addStatus'];
      },
      data: Extract<CommandJSONAction, { type: T }>,
    ): void;
  };
} = {
  copy: {
    id: 'copy',
    icon: CopyIcon,
    title: 'Copy to Clipboard',
    onAction({ addStatus }, data) {
      preloadAPI.main.ipc
        .invoke('clipboard:copy', data.content as string)
        .then((result) => {
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
    onAction({ addStatus }, data) {
      preloadAPI.main.ipc
        .invoke('clipboard:paste', data.content)
        .then((result) => {
          resultHandler({ addStatus, result });
        });
    },
  },
  'open-url': {
    id: 'open-url',
    icon: GlobeIcon,
    title: 'Open in Browser',
    onAction({ addStatus }, data) {
      preloadAPI.main.ipc.invoke('shell:open-url', data.url).then((result) => {
        resultHandler({ addStatus, result });
      });
    },
  },
  'show-in-folder': {
    icon: FolderOpenIcon,
    id: 'show-in-folder',
    title: 'Show in Folder',
    onAction({ addStatus }, data) {
      preloadAPI.main.ipc
        .invoke('shell:open-in-folder', data.path)
        .then((result) => {
          resultHandler({ addStatus, result });
        });
    },
  },
};

export default defaultCommandActions;
