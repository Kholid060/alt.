import { CSSProperties, useEffect, useState } from 'react';
import { Code2Icon, GripHorizontalIcon } from 'lucide-react';
import { UiButton, UiCommand } from '@repo/ui';
import CommandHeader from './components/command/CommandHeader';
import CommandFooter from './components/command/CommandFooter';
import CommandContent from './components/command/CommandContent';
import { useCommandStore } from './stores/command.store';
import preloadAPI from './utils/preloadAPI';
import { CommandCtxProvider } from './context/command.context';

function App() {
  const setCommandStoreState = useCommandStore((state) => state.setState);
  const [anu, setAnu] = useState(false);

  useEffect(() => {
    preloadAPI.main.sendIpcMessage('extension:list').then((extensions) => {
      if ('$isError' in extensions) return;

      setCommandStoreState('extensions', extensions);
    });
  }, []);

  return (
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
          <UiButton
            size="icon"
            variant="secondary"
            className="mb-2"
            onClick={() => {
              setAnu(!anu);
            }}
          >
            <Code2Icon className="h-5 w-5" />
          </UiButton>
        </div>
      )}
      <UiCommand className="border rounded-lg">
        <CommandHeader />
        <CommandContent />
        <CommandFooter />
      </UiCommand>
    </CommandCtxProvider>
  );
}

export default App;
