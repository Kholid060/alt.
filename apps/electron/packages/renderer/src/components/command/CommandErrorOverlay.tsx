import { useEffect } from 'react';
import {
  CommandErrorOverlay as CommandErrorOverlayData,
  useCommandStore,
} from '/@/stores/command.store';
import {
  UiAccordion,
  UiAccordionContent,
  UiAccordionItem,
  UiAccordionTrigger,
  UiButton,
} from '@alt-dot/ui';
import { TrashIcon, XIcon } from 'lucide-react';
import { useDatabaseQuery } from '/@/hooks/useDatabase';
import preloadAPI from '/@/utils/preloadAPI';

function CommandErrorOverlayContent({
  title,
  errors,
  extensionId,
}: CommandErrorOverlayData) {
  const setCommandStore = useCommandStore.use.setState();
  const errorsQuery = useDatabaseQuery('database:get-extension-errors-list', [
    extensionId,
  ]);

  async function deleteError(errorId: number) {
    try {
      await preloadAPI.main.ipc.invokeWithError(
        'database:delete-extension-errors',
        [errorId],
      );
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    const keydownListener = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (event.key !== 'Escape') return;

      setCommandStore('errorOverlay', null);
    };

    window.addEventListener('keydown', keydownListener, { capture: true });

    return () => {
      window.removeEventListener('keydown', keydownListener, { capture: true });
    };
  }, [setCommandStore]);

  if (!errorsQuery.data) return null;

  return (
    <div className="absolute top-0 left-0 h-full w-full z-50 bg-black/10 backdrop-blur-sm rounded-lg overflow-hidden">
      <div className="bg-card absolute bottom-0 w-full rounded-b-lg p-4 border-t-2 border-destructive max-h-full overflow-auto">
        <div className="flex items-center gap-3">
          <UiButton
            size="icon-sm"
            variant="secondary"
            onClick={() => setCommandStore('errorOverlay', null)}
          >
            <XIcon className="h-5 w-5" />
          </UiButton>
          <p className="text-destructive-text">{title}</p>
        </div>
        <UiAccordion type="multiple" className="mt-2">
          {[...errors, ...errorsQuery.data].map((error, index) => (
            <UiAccordionItem key={index} value={index.toString()}>
              <UiAccordionTrigger
                className="text-sm py-3"
                suffixSlot={
                  error.id >= 0 && (
                    <>
                      <hr className="w-px h-6 mx-4 bg-border" />
                      <UiButton
                        size="icon-sm"
                        variant="ghost"
                        className="mr-2"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteError(error.id);
                        }}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </UiButton>
                    </>
                  )
                }
              >
                {error.title ||
                  error.message.slice(0, error.message.indexOf('\n'))}
                <div className="flex-grow"></div>
              </UiAccordionTrigger>
              <UiAccordionContent className="whitespace-pre-wrap bg-background px-4 py-2 rounded-md font-mono text-muted-foreground">
                {error.message}
              </UiAccordionContent>
            </UiAccordionItem>
          ))}
        </UiAccordion>
      </div>
    </div>
  );
}

function CommandErrorOverlay() {
  const errorOverlayData = useCommandStore.use.errorOverlay();

  if (!errorOverlayData) return null;

  errorOverlayData.title;
  return <CommandErrorOverlayContent {...errorOverlayData} />;
}

export default CommandErrorOverlay;
