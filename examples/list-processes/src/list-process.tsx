import {
  _extension,
  UiExtIcon,
  UiList,
  UiListItem,
  commandRenderer,
  UiImage,
} from '@altdot/extension';
import { useEffect, useState, useCallback } from 'react';
import fetchProcess, { ProcessItem } from './utils/fetchProcess';
import { formatBytes } from './utils/helper';

function ListProcess() {
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'error' | 'loading'>('loading');

  async function killProcess(processItem: ProcessItem) {
    try {
      const result = await _extension.runtime.command.launch({
        args: { name: processItem.processName },
        name: 'kill-process.js',
      });
      if (!result.success) {
        throw new Error(result.errorMessage);
      }

      setProcesses(
        processes.filter((item) => item.processName !== processItem.name),
      );
      _extension.ui.showToast({
        title: `"${processItem.name}" process killed`,
      });
    } catch (error) {
      _extension.ui.showToast({
        type: 'error',
        title: 'Something went wrong!',
        description: (error as Error).message,
      });
    }
  }

  const loadProsses = useCallback((isReload?: boolean) => {
    const toast = isReload
      ? _extension.ui.createToast({
          type: 'loading',
          title: 'Reloading...',
        })
      : null;
    toast?.show();

    fetchProcess()
      .then((items) => {
        setProcesses(items?.sort((a, z) => z.memory - a.memory) ?? []);
        setStatus('idle');
        toast?.hide();
      })
      .catch((error) => {
        toast?.hide();
        _extension.ui.showToast({
          type: 'error',
          description: error.message,
          title: 'Something when wrong!',
        });
        setStatus('error');
      });
  }, []);

  const listItems: UiListItem[] = processes.map((item) => ({
    icon: (
      <UiImage
        loading="lazy"
        style={{ height: '100%', width: '100%' }}
        src={_extension.runtime.getFileIconURL(encodeURIComponent(item.path))}
      />
    ),
    title: item.name,
    value: item.processName,
    subtitle: item.name === item.processName ? '' : item.processName,
    group: `Running processes (${processes.length})`,
    actions: [
      {
        type: 'button',
        value: 'kill-process',
        title: 'Kill process',
        color: 'destructive',
        icon: UiExtIcon.XCircle,
        onAction() {
          killProcess(item);
        },
      },
      {
        type: 'button',
        value: 'open-location',
        icon: UiExtIcon.FolderOpen,
        title: 'Open file location',
        onAction() {
          _extension.shell.showItemInFolder(item.path);
        },
      },
      {
        type: 'button',
        value: 'reload',
        title: 'Reload',
        icon: UiExtIcon.RotateCw,
        shortcut: { key: 'r', mod1: 'ctrlKey' },
        onAction() {
          loadProsses(true);
        },
      },
    ],
    suffix: (
      <span
        className="text-muted-foreground text-xs"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {formatBytes(item.memory, 1)} ｜ {item.cpu}%
      </span>
    ),
  }));

  useEffect(() => {
    loadProsses();
  }, [loadProsses]);

  if (status === 'error') {
    return (
      <p className="p-4 text-center text-destructive-text">
        Error when fetching processes
      </p>
    );
  }

  if (status === 'loading') {
    return (
      <p className="p-4 text-center text-muted-foreground">
        Fetching processes...
      </p>
    );
  }

  return (
    <div className="p-2">
      <UiList items={listItems} />
    </div>
  );
}

export default commandRenderer(ListProcess);
