import { useLazyRef } from '@/hooks/useLazyRef';
import { KeyboardShortcut } from '@altdot/shared';
import {
  useContext,
  useSyncExternalStore,
  useRef,
  useMemo,
  createContext,
  useEffect,
} from 'react';

export interface UiListSelectedItemAction {
  value: string;
  onAction: () => void;
  shortcut?: KeyboardShortcut;
  items?: UiListSelectedItemAction[];
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface UiListSelectedItem<M = any> {
  id: string;
  metadata: M;
  index: number;
  actionIndex: number;
  actions: UiListSelectedItemAction[];
}

interface UiListState {
  search: string;
  selectedItem: UiListSelectedItem;
}
interface UiListStore {
  containerRef: React.RefObject<HTMLDivElement>;
  listController: React.RefObject<UiListController | null>;
  setController(controller: UiListController | null): void;
  emit(): void;
  snapshot(): UiListState;
  subscribe(callback: () => void): () => void;
  setSelectedItem(detail: UiListSelectedItem, replace?: true): void;
  listControllerKeyBind(
    event: KeyboardEvent,
    isRemoteController?: boolean,
  ): boolean;
  setSelectedItem(detail: Partial<UiListSelectedItem>, replace?: false): void;
  setSelectedItem(detail: Partial<UiListSelectedItem>, replace: false): void;
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
  nextAction(): void;
  prevAction(): void;
  runActionByShortcut(event: KeyboardEvent): boolean;
}

const TEXT_FIELD_TAGS = ['INPUT', 'TEXTAREA'];

export function UiListProvider({ children }: { children: React.ReactNode }) {
  const listeners = useLazyRef<Set<() => void>>(() => new Set());
  const state = useLazyRef<UiListState>(() => ({
    search: '',
    selectedItem: {
      id: '',
      index: -1,
      actions: [],
      metadata: {},
      actionIndex: -1,
    },
  }));
  const containerRef = useRef<HTMLDivElement>(null);
  const listController = useRef<UiListController | null>(null);

  const store = useMemo<Omit<UiListStore, 'listController' | 'containerRef'>>(
    () => ({
      emit() {
        listeners.current.forEach((listener) => listener());
      },
      setState(key, value, emit = true) {
        if (Object.is(state.current[key], value)) return;

        state.current[key] = value;
        if (emit) store.emit();
      },
      setSelectedItem(payload, replace = true) {
        if (Object.is(state.current.selectedItem.id, payload.id)) return;

        if (replace) {
          state.current.selectedItem = payload as UiListSelectedItem;
          store.emit();
        } else {
          state.current.selectedItem = {
            ...state.current.selectedItem,
            ...payload,
          };
        }
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
      listControllerKeyBind(event, isRemoteController = false) {
        const controller = listController.current;
        if (!controller && !isRemoteController) return false;

        const isRunningAction =
          listController.current?.runActionByShortcut(event) ?? false;
        if (isRunningAction) return false;

        switch (event.key) {
          case 'Home':
            event.preventDefault();
            controller?.firstItem();
            return true;
          case 'End':
            event.preventDefault();
            controller?.lastItem();
            return true;
          case 'Enter':
            event.preventDefault();
            controller?.selectItem();
            return true;
          case 'ArrowUp':
            event.preventDefault();
            event.altKey ? controller?.prevGroup() : controller?.prevItem();
            return true;
          case 'ArrowDown':
            event.preventDefault();
            event.altKey ? controller?.nextGroup() : controller?.nextItem();
            return true;
          case 'ArrowLeft':
          case 'ArrowRight': {
            const target = event.target as HTMLInputElement;
            const toLeft = event.key === 'ArrowLeft';
            const { id, actionIndex, actions } = state.current.selectedItem;
            const isInTextField = target
              ? !TEXT_FIELD_TAGS.includes(target.tagName) ||
                target.selectionStart !== target.selectionEnd ||
                target.selectionStart !== target.value.length
              : false;

            if (
              !id ||
              actions.length <= 0 ||
              isInTextField ||
              (toLeft && actionIndex <= -1) ||
              (!toLeft && actionIndex >= actions.length - 1)
            )
              return false;

            event.preventDefault();

            state.current.selectedItem.actionIndex += toLeft ? -1 : 1;
            store.emit();
            return true;
          }
        }

        return false;
      },
    }),
    [listeners, state],
  );

  useEffect(() => {
    const listenersList = listeners.current;

    return () => {
      state.current = {
        search: '',
        selectedItem: {
          id: '',
          index: -1,
          actions: [],
          metadata: {},
          actionIndex: -1,
        },
      };
      listenersList.clear();
    };
  }, [listeners, state]);

  return (
    <UiListStoreContext.Provider
      value={{ ...store, listController, containerRef }}
    >
      {children}
    </UiListStoreContext.Provider>
  );
}
