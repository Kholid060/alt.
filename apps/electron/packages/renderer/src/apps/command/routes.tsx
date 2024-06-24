import CommandList from './routes/CommandList';
import CommandView from './routes/CommandView';
import CommandViewJSON from './routes/CommandViewJSON';
import ConfigInput from './routes/ConfigInput';
import CreateCommandScript from './routes/CreateCommandScript';
import FallbackCommands from './routes/FallbackCommands';
import RunningProcess from './routes/RunningProcess';
import StoreExtensionsInstall from './routes/StoreExtensionsInstall';
import { CommandRoute } from '/@/interface/command-route.interface';

export const commandAppRoutes = [
  {
    path: '',
    name: 'home',
    element: CommandList,
  },
  {
    name: 'store-extension-install',
    element: StoreExtensionsInstall,
    path: '/store/extensions/:extensionId/install',
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
    element: RunningProcess,
    name: 'running-process',
    path: '/running-process',
  },
  {
    element: ConfigInput,
    path: '/configs/:configId',
  },
] as const satisfies CommandRoute[];
