import { cn } from '@repo/ui';
import CommandList from './CommandList';
import { useCommandStore } from '/@/stores/command.store';
import CommandExtensionContent from './CommandExtensionContent';
import { useEffect, useMemo, useRef } from 'react';
import { ExtensionCommand } from '@repo/extension-core';

function CommandContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const resizerContainerRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const resizeEl = resizerContainerRef.current;
    if (!resizeEl) return;

    let animationFrame: number;
    const observer = new ResizeObserver(() => {
      animationFrame = requestAnimationFrame(() => {
        const height = resizeEl.offsetHeight;
        containerRef.current?.style.setProperty(
          '--ui-list-height',
          height.toFixed(1) + 'px',
        );
      });
    });
    observer.observe(resizeEl);

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.unobserve(resizeEl);
    };
  }, []);

  return (
    <>
      <div
        className={cn('max-h-80 min-h-48 overflow-auto', !extViewId && 'p-2')}
      >
        <div
          ref={containerRef}
          style={{
            height: 'var(--ui-list-height)',
            transition: 'height 250ms ease',
          }}
        >
          <div ref={resizerContainerRef}>
            {extViewId && extViewId.commandType.startsWith('view') ? (
              <CommandExtensionContent
                type={extViewId.commandType}
                extensionId={extViewId.extId}
                commandId={extViewId.commandId}
              />
            ) : (
              <CommandList />
            )}
          </div>
        </div>
      </div>
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
