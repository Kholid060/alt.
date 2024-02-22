import { CSSProperties, useEffect } from 'react';
import { GripHorizontalIcon } from 'lucide-react';
import { UiButton, UiCommand } from '@repo/ui';
import CommandHeader from './components/command/CommandHeader';
import CommandFooter from './components/command/CommandFooter';
import CommandContent from './components/command/CommandContent';
import { useCommandStore } from './stores/command.store';
import preloadAPI from './utils/preloadAPI';

function App() {
  const setCommandStoreState = useCommandStore((state) => state.setState);

  useEffect(() => {
    preloadAPI.main.sendIpcMessage('extension:list').then((extensions) => {
      setCommandStoreState('extensions', extensions);
    });
  }, []);

  return (
    <>
      {import.meta.env.DEV &&
        <UiButton
          size="icon"
          variant="secondary"
          className="mb-2 cursor-move"
          style={{ WebkitAppRegion: 'drag' } as CSSProperties}
        >
          <GripHorizontalIcon className="h-5 w-5" />
        </UiButton>
      }
      <UiCommand className="border rounded-lg">
        <CommandHeader />
        <CommandContent />
        <CommandFooter />
      </UiCommand>
    </>
  );
}

export default App;
