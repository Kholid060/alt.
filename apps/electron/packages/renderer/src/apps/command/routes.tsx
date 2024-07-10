import RouteWorkflowInstall from '../dashboard/routes/RouteWorkflowInstall';
import CommandList from './routes/CommandList';
import CommandView from './routes/CommandView';
import CommandViewJSON from './routes/CommandViewJSON';
import CommandWorkflowsList from './routes/CommandWorkflowsList';
import ConfigInput from './routes/ConfigInput';
import CreateCommandScript from './routes/CreateCommandScript';
import ExtensionAccounts from './routes/ExtensionAccounts';
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
    name: 'connected-accounts',
    element: ExtensionAccounts,
    path: '/connected-accounts',
  },
  {
    name: 'store-workflow-install',
    element: RouteWorkflowInstall,
    path: '/store/workflows/:workflowId/install',
  },
  {
    element: CommandView,
    name: 'extension-command-view',
    path: '/extensions/:extensionId/:commandId/view',
  },
  {
    element: CommandWorkflowsList,
    name: 'workflows-list-pagae',
    path: '/workflows',
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
