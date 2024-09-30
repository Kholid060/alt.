import { createStoreSelectors } from '@/utils/store-utils';
import { create } from 'zustand';

interface AppStoreState {
  hideFooter: boolean;
}
interface AppStoreActions {
  $reset(): void;
  setHideFooter(hideFooter: boolean): void;
}

export type AppStore = AppStoreState & AppStoreActions;

const initialData: AppStoreState = {
  hideFooter: false,
};

const useAppStoreBase = create<AppStore>((set) => ({
  ...initialData,
  setHideFooter(hideFooter) {
    set({ hideFooter });
  },
  $reset() {
    set({ ...initialData });
  },
}));

export const useAppStore = createStoreSelectors(useAppStoreBase);
