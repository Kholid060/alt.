import { createContext, useRef } from 'react';
import {
  CommandRouteStore,
  createCommandRouteStore,
} from '../stores/command-route.store';
import {
  CommandRoute,
  CommandRoutes,
} from '../interface/command-route.interface';
import { useCommandRoute } from '../hooks/useCommandRoute';
import { useShallow } from 'zustand/react/shallow';

export const CommandRouteContext = createContext<CommandRouteStore | null>(
  null,
);

export function createCommandRoutes(routes: CommandRoute[]) {
  return routes.reduce<CommandRoutes>((acc, { path, ...rest }) => {
    acc[path] = {
      ...rest,
      basePath: path,
      path: new URLPattern({ pathname: path }),
    };

    return acc;
  }, {});
}

export function CommandRouteProvider({
  routes,
  children,
}: {
  routes: CommandRoutes;
  children?: React.ReactNode;
}) {
  const commandRouteStore = useRef<CommandRouteStore>();
  if (!commandRouteStore.current) {
    commandRouteStore.current = createCommandRouteStore({ routes });
  }

  return (
    <CommandRouteContext.Provider value={commandRouteStore.current}>
      {children}
    </CommandRouteContext.Provider>
  );
}

export function CommandRouteOutlet() {
  const [activeRoute, routes] = useCommandRoute(
    useShallow((state) => [state.currentRoute, state.routes]),
  );

  const Component = activeRoute ? routes[activeRoute.basePath]?.element : null;
  if (!Component) return;

  return <Component key={activeRoute?.path} />;
}
