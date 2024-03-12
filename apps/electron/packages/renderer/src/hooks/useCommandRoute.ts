import { useContext } from 'react';
import { CommandRouteContext } from '../context/command-route.context';
import { CommandRouteStoreData } from '../stores/command-route.store';
import { useStore } from 'zustand';

export function useCommandRoute<T>(
  selector: (state: CommandRouteStoreData) => T,
): T {
  const store = useContext(CommandRouteContext);
  if (!store) throw new Error('Missing CommandRoute.Provider in the tree');

  return useStore(store, selector);
}

export function useCommandNavigate() {
  const navigate = useCommandRoute((state) => state.navigate);

  return navigate;
}
