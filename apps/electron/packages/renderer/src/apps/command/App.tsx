import { UiTooltipProvider } from '@repo/ui';
import CommandHeader from '/@/components/command/CommandHeader';
import CommandFooter from '/@/components/command/CommandFooter';
import CommandContent from '/@/components/command/CommandContent';
import { CommandCtxProvider } from '/@/context/command.context';
import { UiListProvider } from '@repo/ui/dist/context/list.context';
import {
  CommandRouteProvider,
  createCommandRoutes,
} from '/@/context/command-route.context';
import CommandErrorOverlay from '/@/components/command/CommandErrorOverlay';
import AppDevtools from '/@/components/app/AppDevtools';
import AppEventListener from '/@/components/app/AppEventListener';
import { DatabaseProvider } from '/@/context/database.context';
import { commandAppRoutes } from './routes';
import { useCommandStore } from '/@/stores/command.store';
import { useEffect } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import CommandOAuthOverlay from '/@/components/command/CommandOAuthOverlay';

const routes = createCommandRoutes(commandAppRoutes);

function App() {
  useEffect(() => {
    const onVisibilityChange = () => {
      const { isWindowHidden } = useCommandStore.getState();
      if (!isWindowHidden && document.visibilityState === 'hidden') {
        preloadAPI.main.ipc.invoke('command-window:close');
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return (
    <UiTooltipProvider>
      <DatabaseProvider>
        <CommandRouteProvider routes={routes}>
          <CommandCtxProvider>
            <AppEventListener />
            <div className="p-0.5">
              <UiListProvider>
                <AppDevtools />
                <div className="bg-background border rounded-lg w-full z-10 relative">
                  <CommandHeader />
                  <CommandContent />
                  <CommandErrorOverlay />
                  <CommandOAuthOverlay />
                </div>
              </UiListProvider>
              <CommandFooter />
            </div>
          </CommandCtxProvider>
        </CommandRouteProvider>
      </DatabaseProvider>
    </UiTooltipProvider>
  );
}

export default App;
