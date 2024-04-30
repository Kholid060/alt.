import { create } from 'zustand';
import createStoreSelectors from '../utils/createStoreSelector';
import { subscribeWithSelector } from 'zustand/middleware';

export interface DashboardStoreState {
  hideSidebar: boolean;
}

export interface DashboardStoreActions {
  setHideSidebar(force?: boolean): void;
}

export type DashboardStore = DashboardStoreState & DashboardStoreActions;

const initialState: DashboardStoreState = {
  hideSidebar: false,
};

const dashboardStore = create(
  subscribeWithSelector<DashboardStore>((set, get) => ({
    ...initialState,
    setHideSidebar(force) {
      set({
        hideSidebar: typeof force === 'boolean' ? force : !get().hideSidebar,
      });
    },
  })),
);

export const useDashboardStore = createStoreSelectors(dashboardStore);
