import { useEffect, useState } from 'react';
import {
  CommandRouteStoreState,
  useCommandRouteStore,
} from '/@/stores/command-route.store';

export interface CommandRoute {
  name?: string;
  path: string | string[];
  element: JSX.Element;
}

export interface CommandRouteParsed extends Omit<CommandRoute, 'path'> {
  path: URLPattern | URLPattern[];
}

export type CommandRoutes = CommandRouteParsed[];

export function createCommandRoutes(routes: CommandRoute[]): CommandRoutes {
  return routes.map(({ path, ...rest }) => ({
    ...rest,
    path:
      typeof path === 'string'
        ? new URLPattern({ pathname: path })
        : path.map((str) => new URLPattern({ pathname: str })),
  }));
}

function parsePath(
  route: CommandRouteParsed,
  path: string,
  urlPattern: URLPattern,
) {
  const result: CommandRouteStoreState['parsedPath'] = {
    params: {},
    name: route.name,
  };

  const parsedPath = urlPattern.exec({ pathname: path });
  if (parsedPath) {
    result.params = parsedPath.pathname.groups;
  }

  return result;
}

function CommandRoute({ routes }: { routes: CommandRoutes }) {
  const [activeRoute, setActiveRoute] = useState<CommandRouteParsed | null>(
    null,
  );

  useEffect(() => {
    const findActivePath = (activePath: string) => {
      let currentRoute: CommandRouteParsed | null = null;
      let parsedPath: CommandRouteStoreState['parsedPath'] = { params: {} };

      for (const route of routes) {
        if (Array.isArray(route.path)) {
          const index = route.path.findIndex((pattern) =>
            pattern.test({ pathname: activePath }),
          );
          if (index === -1) continue;

          currentRoute = route;
          parsedPath = parsePath(route, activePath, route.path[index]);

          break;
        }

        const isMatch = route.path.test({ pathname: activePath });
        if (isMatch) {
          currentRoute = route;
          parsedPath = parsePath(route, activePath, route.path);

          break;
        }
      }

      useCommandRouteStore.getState().setParsedPath(parsedPath);
      setActiveRoute(currentRoute);
    };
    findActivePath('');

    return useCommandRouteStore.subscribe(
      (state) => state.path,
      findActivePath,
    );
  }, []);

  if (!activeRoute) return null;

  return activeRoute.element;
}

export default CommandRoute;
