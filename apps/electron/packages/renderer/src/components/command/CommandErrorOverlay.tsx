import { useEffect } from 'react';
import { useCommandStore } from '/@/stores/command.store';
import { UiButton } from '@repo/ui';
import { XIcon } from 'lucide-react';

function CommandErrorOverlay() {
  const setCommandStore = useCommandStore.use.setState();
  const errorOverlayData = useCommandStore.use.errorOverlay();

  useEffect(() => {
    const keydownListener = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (event.key !== 'Escape') return;

      setCommandStore('errorOverlay', null);
    };

    if (errorOverlayData) {
      window.addEventListener('keydown', keydownListener, { capture: true });
    } else {
      window.removeEventListener('keydown', keydownListener, { capture: true });
    }

    return () => {
      window.removeEventListener('keydown', keydownListener, { capture: true });
    };
  }, [errorOverlayData, setCommandStore]);

  if (!errorOverlayData) return null;

  return (
    <div className="absolute top-0 left-0 h-full w-full z-50 bg-black/10 backdrop-blur-sm rounded-lg">
      <div className="bg-card absolute bottom-0 w-full rounded-b-lg p-4 border-t-2 border-destructive">
        <div className="flex items-center gap-3">
          <UiButton
            size="icon-sm"
            variant="secondary"
            onClick={() => setCommandStore('errorOverlay', null)}
          >
            <XIcon className="h-5 w-5" />
          </UiButton>
          <p className="text-destructive-text">{errorOverlayData.title}</p>
        </div>
        <div className="whitespace-pre-wrap bg-background px-4 py-2 rounded-md font-mono mt-4 text-muted-foreground">
          {errorOverlayData.content}
        </div>
      </div>
    </div>
  );
}

export default CommandErrorOverlay;
