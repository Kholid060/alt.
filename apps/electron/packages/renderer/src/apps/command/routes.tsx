import CommandList from './routes/CommandList';
import CommandView from './routes/CommandView';
import CommandViewJSON from './routes/CommandViewJSON';
import ConfigInput from './routes/ConfigInput';
import { CommandRoute } from '/@/interface/command-route.interface';

export const commandAppRoutes = [
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
] as const satisfies CommandRoute[];
