import CommandList from './routes/CommandList';
import CommandView from './routes/CommandView';
import CommandViewJSON from './routes/CommandViewJSON';
import ConfigInput from './routes/ConfigInput';
import CreateCommandScript from './routes/CreateCommandScript';
import FallbackCommands from './routes/FallbackCommands';
import { CommandRoute } from '/@/interface/command-route.interface';

export const commandAppRoutes = [
  {
    path: '',
    name: 'home',
    element: CommandList,
  },
  {
    element: CommandView,
    name: 'extension-command-view',
    path: '/extensions/:extensionId/:commandId/view',
  },
  {
    element: CommandViewJSON,
    name: 'extension-command-view-json',
    path: '/extensions/:extensionId/:commandId/view-json',
  },
  {
    element: CreateCommandScript,
    name: 'create-command-script',
    path: '/create-command-script',
  },
  {
    element: FallbackCommands,
    name: 'fallback-commands',
    path: '/fallback-commands',
  },
  {
    element: ConfigInput,
    path: '/configs/:configId',
  },
] as const satisfies CommandRoute[];
