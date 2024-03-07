import { CSSProperties, useEffect } from 'react';
import { GripHorizontalIcon } from 'lucide-react';
import { UiButton, UiToaster, UiTooltipProvider } from '@repo/ui';
import CommandHeader from './components/command/CommandHeader';
import CommandFooter from './components/command/CommandFooter';
import CommandContent from './components/command/CommandContent';
import { useCommandStore } from './stores/command.store';
import preloadAPI from './utils/preloadAPI';
import { CommandCtxProvider } from './context/command.context';
import AppExtensionSandbox from './components/app/AppExtensionSandbox';
import { UiListProvider } from '@repo/ui/dist/context/list.context';

function App() {
  const setCommandStoreState = useCommandStore((state) => state.setState);

  useEffect(() => {
    preloadAPI.main.sendIpcMessage('extension:list').then((extensions) => {
      if ('$isError' in extensions) return;
      setCommandStoreState('extensions', extensions);
    });
  }, []);

  return (
    <UiTooltipProvider>
      <UiListProvider>
        <CommandCtxProvider>
          {import.meta.env.DEV && (
            <div className="flex items-center gap-2">
              <UiButton
                size="icon"
                variant="secondary"
                className="mb-2 cursor-move"
                style={{ WebkitAppRegion: 'drag' } as CSSProperties}
              >
                <GripHorizontalIcon className="h-5 w-5" />
              </UiButton>
            </div>
          )}
          <div className="bg-popover border rounded-lg">
            <CommandHeader />
            <CommandContent />
            <CommandFooter />
          </div>
          <AppExtensionSandbox />
          <UiToaster viewportClass="right-0 bottom-0 pointer-events-none items-end" />
        </CommandCtxProvider>
      </UiListProvider>
    </UiTooltipProvider>
  );
}

export default App;
