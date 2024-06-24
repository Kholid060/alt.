import { createStore } from 'zustand';
import {
  CommandRoutes,
  CommandRouteActive,
} from '../interface/command-route.interface';

interface CommandRouteProps {
  routes: CommandRoutes;
}

export interface CommandRouteState extends CommandRouteProps {
  currentRoute: CommandRouteActive;
}

export interface CommandRouteActions {
  navigate: (path: string, detail?: { data?: unknown }) => void;
}

export type CommandRouteStore = ReturnType<typeof createCommandRouteStore>;

export type CommandRouteStoreData = CommandRouteState & CommandRouteActions;

export const createCommandRouteStore = (
  initProps?: Partial<CommandRouteProps>,
) => {
  const initState: CommandRouteState = {
    routes: {},
    currentRoute: {
      path: '',
      name: '',
      data: null,
      params: {},
      basePath: '',
    },
  };

  return createStore<CommandRouteStoreData>()((set, get) => ({
    ...initState,
    ...initProps,
    navigate(path, detail = {}) {
      let currentRoute: CommandRouteActive | null = null;
      const routes = get().routes;

      for (const key in routes) {
        const route = routes[key];
        const parsedPath = route.path.exec({ pathname: path });
        if (!parsedPath) continue;

        currentRoute = {
          path,
          data: detail.data,
          name: route.name ?? '',
          basePath: route.basePath,
          params: parsedPath.pathname.groups,
        };

        break;
      }

      if (!currentRoute) throw new Error('Route not found');

      set({ currentRoute });
    },
  }));
};
