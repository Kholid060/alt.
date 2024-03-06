import { cn } from '@repo/ui';
import CommandList from './CommandList';
import CommandExtensionContent from './CommandExtensionContent';
import { useEffect, useRef } from 'react';
import CommandRoute, { createCommandRoutes } from './CommandRoute';

const routes = createCommandRoutes([
  {
    path: ['', '/extensions/:extensionId'],
    element: <CommandList />,
  },
  {
    name: 'extension-command-view',
    path: '/extensions/:extensionId/:commandId/view',
    element: <CommandExtensionContent />,
  },
]);

function CommandContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const resizerContainerRef = useRef<HTMLDivElement>(null);

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
      <div className={cn('max-h-80 min-h-48 overflow-auto')}>
        <div
          ref={containerRef}
          style={{
            height: 'var(--ui-list-height)',
            transition: 'height 250ms ease',
          }}
        >
          <div ref={resizerContainerRef}>
            <CommandRoute routes={routes} />
          </div>
        </div>
      </div>
    </>
  );
}

export default CommandContent;
