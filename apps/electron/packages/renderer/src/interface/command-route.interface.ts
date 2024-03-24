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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: null | any;
  params: Record<string, string | undefined>;
}

export interface CommandRouteContextState {
  routes: CommandRoutes;
  activeRoute: CommandRouteActive | null;
}
