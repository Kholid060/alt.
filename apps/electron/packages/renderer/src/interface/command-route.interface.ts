export interface CommandRoute {
  path: string;
  name?: string;
  element: React.FC;
}

export interface CommandRouteParsed extends Omit<CommandRoute, 'path'> {
  path: URLPattern;
  basePath: string;
}

export type CommandRoutes = Record<string, CommandRouteParsed>;

export interface CommandRouteActive {
  path: string;
  name: string;
  basePath: string;
  data: null | unknown;
  params: Record<string, unknown>;
}

export interface CommandRouteContextState {
  routes: CommandRoutes;
  activeRoute: CommandRouteActive | null;
}
