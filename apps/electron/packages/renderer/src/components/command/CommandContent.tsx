import { UiCommandList, cn } from '@repo/ui';
import CommandList from './CommandList';
import { useCommandStore } from '/@/stores/command.store';
import CommandExtensionContent from './CommandExtensionContent';
import { useMemo } from 'react';
import { ExtensionCommand } from '@repo/extension-core';

function CommandContent() {
  const paths = useCommandStore((state) => state.paths);

  const extViewId = useMemo(() => {
    const command = paths.at(-1);
    if (command?.type !== 'command' || !command.meta?.type) return null;

    const extension = paths.at(-2);
    if (extension?.type !== 'extension') return null;

    return {
      extId: extension.id,
      commandId: command.id,
      commandType: command.meta.type as ExtensionCommand['type'],
    };
  }, [paths]);

  return (
    <>
      <UiCommandList
        className={cn('max-h-80 min-h-48', !extViewId && 'p-2')}
        style={{
          height: 'var(--cmdk-list-height)',
          transition: 'height 200ms ease',
        }}
      >
        {extViewId && extViewId.commandType.startsWith('view') ? (
          <CommandExtensionContent
            type={extViewId.commandType}
            extensionId={extViewId.extId}
            commandId={extViewId.commandId}
          />
        ) : (
          <CommandList />
        )}
      </UiCommandList>
      {extViewId && extViewId.commandType === 'action' && (
        <CommandExtensionContent
          type={extViewId.commandType}
          extensionId={extViewId.extId}
          commandId={extViewId.commandId}
        />
      )}
    </>
  );
}

export default CommandContent;
