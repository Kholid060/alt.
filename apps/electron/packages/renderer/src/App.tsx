import { useEffect } from 'react';
import { UiButton, UiTooltipProvider } from '@repo/ui';
import CommandHeader from './components/command/CommandHeader';
import CommandFooter from './components/command/CommandFooter';
import CommandContent from './components/command/CommandContent';
import { useCommandStore } from './stores/command.store';
import preloadAPI from './utils/preloadAPI';
import { CommandCtxProvider } from './context/command.context';
import { UiListProvider } from '@repo/ui/dist/context/list.context';
import {
  CommandRouteProvider,
  createCommandRoutes,
} from './context/command-route.context';
import CommandExtensionContent from './routes/CommandExtensionContent';
import CommandList from './routes/CommandList';
import { GripHorizontalIcon } from 'lucide-react';
import CommandEventListener from './components/command/CommandEventListener';
import CommandErrorOverlay from './components/command/CommandErrorOverlay';
import ConfigInput from './routes/ConfigInput';

const routes = createCommandRoutes([
  {
    path: '',
    name: 'home',
    element: CommandList,
  },
  {
    name: 'extension-command-view',
    path: '/extensions/:extensionId/:commandId/view',
    element: CommandExtensionContent,
  },
  {
    element: ConfigInput,
    path: '/configs/:configId',
  },
]);

function App() {
  const setCommandStoreState = useCommandStore((state) => state.setState);

  useEffect(() => {
    preloadAPI.main.invokeIpcMessage('extension:list').then((extensions) => {
      if ('$isError' in extensions) return;
      setCommandStoreState('extensions', extensions);
    });
  }, []);

  return (
    <UiTooltipProvider>
      <CommandCtxProvider>
        <CommandRouteProvider routes={routes}>
          <div className="p-0.5">
            {import.meta.env.DEV && (
              <UiButton
                size="icon"
                variant="secondary"
                className="cursor-move mb-2"
                style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
              >
                <GripHorizontalIcon className="h-5 w-5" />
              </UiButton>
            )}
            <UiListProvider>
              <div className="bg-background border rounded-lg w-full z-10 relative">
                <CommandHeader />
                <CommandContent />
                <CommandErrorOverlay />
              </div>
            </UiListProvider>
            <CommandFooter />
          </div>
          <CommandEventListener />
        </CommandRouteProvider>
      </CommandCtxProvider>
    </UiTooltipProvider>
  );
}

export default App;
