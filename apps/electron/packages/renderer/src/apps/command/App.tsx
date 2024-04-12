import { useEffect } from 'react';
import { UiTooltipProvider } from '@repo/ui';
import CommandHeader from '/@/components/command/CommandHeader';
import CommandFooter from '/@/components/command/CommandFooter';
import CommandContent from '/@/components/command/CommandContent';
import { useCommandStore } from '/@/stores/command.store';
import preloadAPI from '/@/utils/preloadAPI';
import { CommandCtxProvider } from '/@/context/command.context';
import { UiListProvider } from '@repo/ui/dist/context/list.context';
import {
  CommandRouteProvider,
  createCommandRoutes,
} from '/@/context/command-route.context';
import CommandView from './routes/CommandView';
import CommandList from './routes/CommandList';
import CommandEventListener from '/@/components/command/CommandEventListener';
import CommandErrorOverlay from '/@/components/command/CommandErrorOverlay';
import ConfigInput from './routes/ConfigInput';
import CommandViewJSON from './routes/CommandViewJSON';
import AppDevtools from '/@/components/app/AppDevtools';
import AppEventListener from '/@/components/app/AppEventListener';
import ExtensionWorker from '/@/utils/extension/ExtensionWorker';

const routes = createCommandRoutes([
  {
    path: '',
    name: 'home',
    element: CommandList,
  },
  {
    name: 'extension-command-view',
    path: '/extensions/:extensionId/:commandId/view',
    element: CommandView,
  },
  {
    name: 'extension-command-view-json',
    path: '/extensions/:extensionId/:commandId/view-json',
    element: CommandViewJSON,
  },
  {
    element: ConfigInput,
    path: '/configs/:configId',
  },
]);

function App() {
  const setCommandStoreState = useCommandStore((state) => state.setState);

  useEffect(() => {
    const fetchExtensions = () => {
      preloadAPI.main.invokeIpcMessage('extension:list').then((extensions) => {
        if ('$isError' in extensions) return;
        setCommandStoreState('extensions', extensions);
      });
    };
    fetchExtensions();

    const onVisibilityChange = () => {
      if (ExtensionWorker.instance.worker) return;

      if (document.visibilityState === 'hidden') {
        preloadAPI.main.invokeIpcMessage('app:close-command-window');
      } else {
        fetchExtensions();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return (
    <UiTooltipProvider>
      <CommandCtxProvider>
        <CommandRouteProvider routes={routes}>
          <AppEventListener />
          <div className="p-0.5">
            <UiListProvider>
              <AppDevtools />
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
