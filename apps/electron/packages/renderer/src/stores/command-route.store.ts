import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface CommandRouteBreadcrumb {
  path: string;
  label: string;
}

export interface CommandRouteStoreState {
  path: string;
  pathData: unknown;
  breadcrumbs: CommandRouteBreadcrumb[];
  parsedPath: { name?: string; params: Record<string, unknown> };
}

interface CommandRouteStoreActions {
  setParsedPath: (detail: CommandRouteStoreState['parsedPath']) => void;
  navigate: (
    pathname: string,
    payload?: { breadcrumbs?: CommandRouteBreadcrumb[]; data?: unknown },
  ) => void;
}

type CommandRouteStore = CommandRouteStoreState & CommandRouteStoreActions;

const initialState: CommandRouteStoreState = {
  path: '',
  pathData: null,
  breadcrumbs: [],
  parsedPath: { params: {} },
};

export const useCommandRouteStore = create(
  subscribeWithSelector<CommandRouteStore>((set) => ({
    ...initialState,
    setParsedPath(detail) {
      set({ parsedPath: detail });
    },
    navigate(pathname, { breadcrumbs = [], data } = {}) {
      set({ path: pathname, breadcrumbs, pathData: data });
    },
  })),
);
