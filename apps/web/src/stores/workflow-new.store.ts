import { WebAppWorkflow } from '@alt-dot/shared';
import { StoreApi, createStore } from 'zustand';

export interface WorkflowNewStoreState extends WebAppWorkflow {}

export interface WorkflowNewStoreActions {
  updateState<T extends keyof WorkflowNewStoreState>(
    key: T,
    value: WorkflowNewStoreState[T],
  ): void;
  $reset(): void;
}

export type WorkflowNewStoreValue = WorkflowNewStoreState &
  WorkflowNewStoreActions;

export type WorkflowNewStore = StoreApi<WorkflowNewStoreValue>;

export const createWorkflowNewStore = (data: WebAppWorkflow) => {
  return createStore<WorkflowNewStoreValue>((set) => ({
    ...data,
    banners: [],
    $reset() {
      // @ts-expect-error clear value
      set({ banners: [], manifest: {}, categories: [], repo: {} });
    },
    updateState(key, value) {
      set({ [key]: value });
    },
  }));
};
