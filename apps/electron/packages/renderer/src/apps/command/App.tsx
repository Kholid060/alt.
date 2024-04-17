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

const routes = createCommandRoutes(commandAppRoutes);

function App() {
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
