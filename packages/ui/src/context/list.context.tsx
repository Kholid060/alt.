import { useLazyRef } from '@/hooks/useLazyRef';
import {
  useContext,
  useSyncExternalStore,
  useRef,
  useMemo,
  createContext,
} from 'react';

interface UiListState {
  search: string;
  selectedId: string;
  selectedIndex: number[];
}
interface UiListStore {
  listController: React.RefObject<UiListController | null>;
  setController(controller: UiListController): void;
  emit(): void;
  snapshot(): UiListState;
  subscribe(callback: () => void): () => void;
  listControllerKeyBind(event: KeyboardEvent): void;
  setSelectedItem(id: string, index: number[]): void;
  setState<T extends keyof UiListState>(
    key: T,
    value: UiListState[T],
    emit?: boolean,
  ): void;
}

// @ts-expect-error add later
const UiListStoreContext = createContext<UiListStore>(undefined);

export function useUiListStore(): UiListStore {
  return useContext(UiListStoreContext);
}

export function useUiList<T = unknown>(selector: (state: UiListState) => T) {
  const listStore = useUiListStore();
  const callback = () => selector(listStore.snapshot());

  return useSyncExternalStore(listStore.subscribe, callback, callback);
}

export interface UiListController {
  lastItem(): void;
  nextItem(): void;
  prevItem(): void;
  firstItem(): void;
  prevGroup(): void;
  nextGroup(): void;
  selectItem(): void;
}

export function UiListProvider({ children }: { children: React.ReactNode }) {
  const listeners = useLazyRef<Set<() => void>>(() => new Set());
  const state = useLazyRef<UiListState>(() => ({
    search: '',
    selectedId: '',
    selectedIndex: [],
  }));
  const listController = useRef<UiListController | null>(null);

  const store = useMemo<Omit<UiListStore, 'listController'>>(
    () => ({
      emit() {
        listeners.current.forEach((listener) => listener());
      },
      setState(key, value, emit = true) {
        if (Object.is(state.current[key], value)) return;

        state.current[key] = value;
        if (emit) store.emit();
      },
      setSelectedItem(itemId: string, indexs: number[]) {
        if (Object.is(state.current.selectedId, itemId)) return;

        state.current.selectedId = itemId;
        state.current.selectedIndex = indexs;

        store.emit();
      },
      snapshot() {
        return state.current;
      },
      subscribe(callback) {
        listeners.current.add(callback);
        return () => listeners.current.delete(callback);
      },
      setController(controller) {
        listController.current = controller;
      },
      listControllerKeyBind(event) {
        const controller = listController.current;
        if (!controller) return;

        switch (event.key) {
          case 'Home':
            event.preventDefault();
            controller.firstItem();
            break;
          case 'End':
            event.preventDefault();
            controller.lastItem();
            break;
          case 'Enter':
            event.preventDefault();
            controller.selectItem();
            break;
          case 'ArrowUp':
            event.preventDefault();
            event.altKey ? controller.prevGroup() : controller.prevItem();
            break;
          case 'ArrowDown':
            event.preventDefault();
            event.altKey ? controller.nextGroup() : controller.nextItem();
            break;
        }
      },
    }),
    [],
  );

  return (
    <UiListStoreContext.Provider value={{ ...store, listController }}>
      {children}
    </UiListStoreContext.Provider>
  );
}
