import { useContext } from 'react';
import { CommandRouteContext } from '../context/command-route.context';
import {
  CommandRouteActions,
  CommandRouteStoreData,
} from '../stores/command-route.store';
import { useStore } from 'zustand';
import {
  CommandPanelHeader,
  useCommandPanelStore,
} from '../stores/command-panel.store';

type CommandNavigateParams = Parameters<CommandRouteActions['navigate']>;
export type CommandNavigateOptions = CommandNavigateParams[1] & {
  panelHeader?: CommandPanelHeader | null;
};

export function useCommandRoute<T>(
  selector: (state: CommandRouteStoreData) => T,
): T {
  const store = useContext(CommandRouteContext);
  if (!store) throw new Error('Missing CommandRoute.Provider in the tree');

  return useStore(store, selector);
}

export function useCommandNavigate() {
  const commandNavigate = useCommandRoute((state) => state.navigate);
  const setCommandPanelHeader = useCommandPanelStore.use.setHeader();

  function navigate(
    path: CommandNavigateParams[0],
    detail?: CommandNavigateOptions,
  ) {
    console.trace(path);
    if (detail && Object.hasOwn(detail, 'panelHeader')) {
      setCommandPanelHeader(detail.panelHeader!);
    }

    commandNavigate(path, {
      data: detail?.data,
    });
  }

  return navigate;
}
