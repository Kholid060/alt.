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
import CommandView from './routes/CommandView';
import CommandList from './routes/CommandList';
import CommandErrorOverlay from '/@/components/command/CommandErrorOverlay';
import ConfigInput from './routes/ConfigInput';
import CommandViewJSON from './routes/CommandViewJSON';
import AppDevtools from '/@/components/app/AppDevtools';
import AppEventListener from '/@/components/app/AppEventListener';
import { DatabaseProvider } from '/@/context/database.context';

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
