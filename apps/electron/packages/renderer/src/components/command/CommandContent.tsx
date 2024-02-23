import { UiCommandList, cn } from '@repo/ui';
import CommandList from './CommandList';
import { useCommandStore } from '/@/stores/command.store';
import CommandExtensionContent from './CommandExtensionContent';
import { useMemo } from 'react';

function CommandContent() {
  const paths = useCommandStore((state) => state.paths);

  const extViewId = useMemo(() => {
    const command = paths.at(-1);
    if (command?.type !== 'command') return null;

    const extension = paths.at(-2);
    if (extension?.type !== 'extension') return null;

    return `${extension.id}::${command.id}`;
  }, [paths]);

  return (
    <UiCommandList
      className={cn("max-h-80 min-h-48", !extViewId && 'p-2')}
      style={{ height: 'var(--cmdk-list-height)', transition: 'height 200ms ease' }}
    >
      {extViewId
        ? <CommandExtensionContent extensionId={extViewId} />
        : <CommandList />
      }
    </UiCommandList>
  );
}

export default CommandContent;
