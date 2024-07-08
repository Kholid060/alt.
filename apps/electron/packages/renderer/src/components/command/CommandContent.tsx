import { UiScrollArea } from '@altdot/ui';
import { useEffect, useRef } from 'react';
import { CommandRouteOutlet } from '../../context/command-route.context';

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
      <UiScrollArea
        ref={containerRef}
        type="always"
        className="max-h-80 min-h-48"
        style={{
          height: 'var(--ui-list-height)',
          transition: 'height 250ms ease',
        }}
      >
        <div ref={resizerContainerRef} className="h-full">
          <CommandRouteOutlet />
        </div>
      </UiScrollArea>
    </>
  );
}

export default CommandContent;
