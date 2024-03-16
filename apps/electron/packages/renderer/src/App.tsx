import { useEffect } from 'react';
import { UiToaster, UiTooltipProvider } from '@repo/ui';
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
import CommandExtensionContent from './components/command/CommandExtensionContent';
import CommandList from './components/command/CommandList';

const routes = createCommandRoutes([
  {
    path: '',
    element: CommandList,
  },
  {
    name: 'extension-command-view',
    path: '/extensions/:extensionId/:commandId/view',
    element: CommandExtensionContent,
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
            <UiListProvider>
              <div className="bg-background border rounded-lg w-full">
                <CommandHeader />
                <CommandContent />
              </div>
            </UiListProvider>
            <CommandFooter />
            <UiToaster viewportClass="right-0 bottom-0 pointer-events-none items-end" />
          </div>
        </CommandRouteProvider>
      </CommandCtxProvider>
    </UiTooltipProvider>
  );
}

export default App;
