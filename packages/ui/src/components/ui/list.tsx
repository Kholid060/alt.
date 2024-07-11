import {
  Fragment,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LucideIcon } from 'lucide-react';
import {
  UiListController,
  useUiList,
  useUiListStore,
} from '@/context/list.context';
import { matchSorter } from 'match-sorter';
import { cn } from '@/utils/cn';
import { UiTooltip } from './tooltip';
import {
  getShortcutStr,
  KeyboardShortcut,
  KeyboardShortcutModifier,
} from '@altdot/shared';
import mergeRefs from '@/utils/mergeRefs';

const ITEM_SELECTED_EVENT = 'ui-list-item-selected';

export interface UiListItemAction {
  title: string;
  value: string;
  icon: LucideIcon;
  onAction: () => void;
  shortcut?: KeyboardShortcut;
  color?: 'default' | 'primary' | 'destructive';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface UiListItem<T = any> {
  value: string;
  title: string;
  metadata?: T;
  alias?: string;
  group?: string;
  subtitle?: string;
  keywords?: string[];
  description?: string;
  searchOnly?: boolean;
  icon?: React.ReactNode;
  onSelected?: () => void;
  detail?: React.ReactNode;
  actions?: UiListItemAction[];
  suffix?: string | React.ReactNode;
}

type UiListGroupItem = [string, UiListItem[]];
type UiListFlatItems = (string | UiListItem)[];

export interface UiListProps
  extends Omit<React.DetailsHTMLAttributes<HTMLDivElement>, 'children'> {
  search?: string;
  items: UiListItem[];
  selectedItem?: string;
  shouldFilter?: boolean;
  noDataSlot?: React.ReactNode;
  disabledItemSelection?: boolean;
  onItemSelected?: (value: string) => void;
  customFilter?: (items: UiListItem[], query: string) => UiListItem[];
  renderGroupHeader?: (label: string, index: number) => React.ReactNode;
  renderItem?: (
    detail: UiListRenderItemDetail,
    index: number,
  ) => React.ReactNode;
}

export interface UiListRenderItemDetail {
  selected: boolean;
  item: UiListItem;
  ref: React.Ref<HTMLDivElement>;
  props: Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>;
}

function findNonSearchOnlyItem(
  items: UiListFlatItems,
  options?: Partial<{
    startIndex: number;
    findGroup: boolean;
    direction: 'prev' | 'next';
  }>,
): { item: UiListItem; index: number } | null {
  const { findGroup, direction, startIndex } = {
    startIndex: 0,
    direction: 'next',
    findGroup: false,
    ...options,
  };
  const isNext = direction === 'next';

  for (
    let index = startIndex;
    index >= 0 && index < items.length;
    index += isNext ? 1 : -1
  ) {
    const currentItem = items[index];
    if (!currentItem || typeof currentItem === 'string') continue;

    if (findGroup) {
      const startItem = items[startIndex] as UiListItem;
      const nextOrPrevItem = items[index - 1];

      if (
        startItem.group === currentItem.group ||
        startItem.group === nextOrPrevItem ||
        typeof nextOrPrevItem !== 'string'
      )
        continue;
    }

    return { item: currentItem, index };
  }

  return null;
}

export interface UiListRef {
  controller: UiListController;
  el: React.RefObject<HTMLDivElement>;
}

export function uiListItemsFilter(items: UiListItem[], query: string) {
  return matchSorter(items, query, {
    keys: [
      'title',
      {
        threshold: matchSorter.rankings.STARTS_WITH,
        key: 'keywords',
      },
      { threshold: matchSorter.rankings.EQUAL, key: 'alias' },
      { minRanking: matchSorter.rankings.EQUAL, key: 'subtitle' },
    ],
  });
}

const UiListRoot = forwardRef<UiListRef, UiListProps>(
  (
    {
      items,
      search,
      noDataSlot,
      renderItem,
      customFilter,
      onItemSelected,
      renderGroupHeader,
      shouldFilter = true,
      disabledItemSelection,
      ...props
    },
    ref,
  ) => {
    const listStore = useUiListStore();
    const query = useUiList((state) => (search ? search : state.search));

    const itemsLen = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredItems = useMemo<UiListFlatItems>(() => {
      let itemList: UiListItem[] = items;
      if (shouldFilter && query?.trim()) {
        itemList = customFilter
          ? customFilter(itemList, query)
          : uiListItemsFilter(itemList, query);
      }

      const groupIndexMap = new Map<string, number>();
      const groupedItems: (UiListItem | [string, UiListItem[]])[] = [];

      for (const item of itemList) {
        if (!item.group) {
          groupedItems.push(item);
          continue;
        }

        let groupIndex = groupIndexMap.get(item.group);
        if (typeof groupIndex !== 'number') {
          groupIndex = groupedItems.length;
          groupIndexMap.set(item.group, groupIndex);
          groupedItems.push([item.group, [item]]);
          continue;
        }

        (groupedItems[groupIndex] as UiListGroupItem)[1].push(item);
      }

      const flatItems = groupedItems.flat(2);
      if (itemsLen.current === null) itemsLen.current = flatItems.length;

      return flatItems;
    }, [query, shouldFilter, items, customFilter]);
    const controller = useMemo<
      UiListController & { itemChanged: boolean }
    >(() => {
      const setSelectedItem = (
        selectedItem: {
          index: number;
          item: Pick<UiListItem, 'value' | 'metadata' | 'actions'>;
        } | null,
      ) => {
        const { index, item } = selectedItem ?? {
          index: -1,
          item: { value: '', metadata: {} },
        };
        listStore.setSelectedItem({
          index,
          id: item.value,
          actionIndex: -1,
          metadata: item.metadata,
          actions:
            item.actions?.map((action) => ({
              value: action.value,
              onAction: action.onAction,
              shortcut: action.shortcut,
            })) ?? [],
        });
      };

      let itemChanged = itemsLen.current !== filteredItems.length;
      if (!itemChanged) {
        const { selectedItem } = listStore.snapshot();
        const item = filteredItems[selectedItem.index];
        itemChanged =
          typeof item === 'string' || !item
            ? true
            : item.value !== selectedItem.id;
      }

      return {
        itemChanged,
        selectItem() {
          const { index, actionIndex, actions, id } =
            listStore.snapshot().selectedItem;
          const currentItem = filteredItems[index];

          if (!id || !currentItem || typeof currentItem === 'string') return;

          if (actionIndex >= 0 && actions && actions[actionIndex]) {
            actions[actionIndex].onAction();
            return;
          }

          const itemEl = document.querySelector<HTMLElement>(
            `[data-item-value="${id}"]`,
          );
          itemEl?.dispatchEvent(new Event(ITEM_SELECTED_EVENT));

          onItemSelected?.(id);
        },
        runActionByShortcut(event) {
          const { actions } = listStore.snapshot().selectedItem;
          if (!actions) return false;

          const { altKey, ctrlKey, metaKey, shiftKey } = event;
          if (!altKey && !ctrlKey && !metaKey && !shiftKey) return false;

          const checkShortcutMod = (mod: KeyboardShortcutModifier) => {
            if (mod === 'mod') return ctrlKey || metaKey;

            return event[mod];
          };
          const itemAction = actions.find(({ shortcut }) => {
            if (!shortcut) return;

            const isModMatch =
              checkShortcutMod(shortcut.mod1) &&
              (shortcut.mod2 ? checkShortcutMod(shortcut.mod2) : true);
            const isKeyMatch =
              event.key.toLowerCase() === shortcut.key.toLowerCase();

            return isModMatch && isKeyMatch;
          });

          if (itemAction) {
            itemAction.onAction();
            event.preventDefault();
          }

          return Boolean(itemAction);
        },
        nextAction() {
          const { actionIndex, actions, ...rest } =
            listStore.snapshot().selectedItem;
          if (actionIndex >= actions.length - 1) return;

          listStore.setSelectedItem({
            ...rest,
            actions,
            actionIndex: actionIndex + 1,
          });
        },
        prevAction() {
          const { actionIndex, actions, ...rest } =
            listStore.snapshot().selectedItem;
          if (actionIndex <= 0) return;

          listStore.setSelectedItem({
            ...rest,
            actions,
            actionIndex: actionIndex - 1,
          });
        },
        firstItem() {
          const firstItem = findNonSearchOnlyItem(filteredItems);
          setSelectedItem(firstItem);
        },
        lastItem() {
          const lastItem = findNonSearchOnlyItem(filteredItems, {
            direction: 'prev',
            startIndex: filteredItems.length - 1,
          });
          if (!lastItem) return;

          setSelectedItem(lastItem);
        },
        nextGroup() {
          const currentIndex = listStore.snapshot().selectedItem.index;
          if (currentIndex === filteredItems.length - 1) return;

          const nextGroup = findNonSearchOnlyItem(filteredItems, {
            findGroup: true,
            startIndex: currentIndex,
          });
          if (!nextGroup) return;

          setSelectedItem(nextGroup);
        },
        prevGroup() {
          const currentIndex = listStore.snapshot().selectedItem.index;
          if (currentIndex === 0) return;

          const prevGroup = findNonSearchOnlyItem(filteredItems, {
            findGroup: true,
            direction: 'prev',
            startIndex: currentIndex,
          });
          if (!prevGroup) return;

          setSelectedItem(prevGroup);
        },
        nextItem() {
          const index = listStore.snapshot().selectedItem.index;
          const nextItem = findNonSearchOnlyItem(filteredItems, {
            startIndex: index + 1,
          });
          if (!nextItem) return;

          setSelectedItem(nextItem);
        },
        prevItem() {
          const index = listStore.snapshot().selectedItem.index;
          const prevItem = findNonSearchOnlyItem(filteredItems, {
            direction: 'prev',
            startIndex: index - 1,
          });
          if (!prevItem) return;

          setSelectedItem(prevItem);
        },
      };
    }, [filteredItems, listStore, onItemSelected]);

    useImperativeHandle(ref, () => ({ controller, el: containerRef }), [
      controller,
    ]);

    const onPointerMove = useCallback(
      (item: UiListItem, index: number) => {
        if (
          disabledItemSelection ||
          listStore.snapshot().selectedItem.id === item.value
        )
          return;

        listStore.setSelectedItem(
          {
            index,
            actions: [],
            id: item.value,
            actionIndex: -1,
            metadata: item.metadata,
          },
          true,
        );
      },
      [disabledItemSelection, listStore],
    );
    const onItemClick = useCallback(
      (item: UiListItem) => {
        item.onSelected?.();
        onItemSelected?.(item.value);
      },
      [onItemSelected],
    );

    useEffect(() => {
      if (disabledItemSelection) return;

      if (controller.itemChanged) controller.firstItem();
      listStore.setController(controller);

      return () => {
        listStore.setController(null);
      };
    }, [disabledItemSelection, controller, listStore]);
    useEffect(() => {
      return () => {
        listStore.setSelectedItem({
          id: '',
          index: -1,
          actions: [],
          metadata: {},
          actionIndex: -1,
        });
      };
    }, [listStore]);

    return (
      <div ref={containerRef} {...props}>
        {filteredItems.length === 0 &&
          (noDataSlot || (
            <p className="text-center text-muted-foreground my-4">No data</p>
          ))}
        {filteredItems.map((item, index) => {
          if (typeof item === 'string') {
            return (
              <Fragment key={item}>
                {renderGroupHeader ? (
                  renderGroupHeader(item, index)
                ) : (
                  <UiListGroupHeading key={item}>{item}</UiListGroupHeading>
                )}
              </Fragment>
            );
          }

          if (item.searchOnly && !query?.trim()) return null;

          return (
            <UiListItemRenderer
              key={item.value}
              item={item}
              index={index}
              value={item.value}
              renderItem={renderItem}
              onClick={() => onItemClick(item)}
              onPointerMove={() => onPointerMove(item, index)}
            />
          );
        })}
      </div>
    );
  },
);
UiListRoot.displayName = 'UiListRoot';

function UiListItemRenderer({
  item,
  value,
  index,
  onClick,
  renderItem,
  onPointerMove,
}: {
  value: string;
  index: number;
  item: UiListItem;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> &
  Pick<UiListProps, 'renderItem'>) {
  const itemId = useId();

  const itemValue = useRef(value || itemId);
  const isSelected = useUiList(
    (state) => state.selectedItem.id === itemValue.current,
  );

  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSelected || !elRef.current) return;

    const parentEl = elRef.current.parentElement;
    if (
      parentEl?.classList.contains('group-list') &&
      parentEl.firstElementChild === elRef.current
    ) {
      parentEl.previousElementSibling?.scrollIntoView({
        block: 'nearest',
      });
    }

    elRef.current.scrollIntoView({
      block: 'nearest',
    });
  }, [isSelected]);

  if (renderItem) {
    return renderItem(
      {
        item,
        ref: elRef,
        selected: isSelected,
        props: { onPointerMove, onClick },
      },
      index,
    );
  }

  return (
    <UiListItem
      ref={elRef}
      icon={item.icon}
      alias={item.alias}
      title={item.title}
      value={item.value}
      suffix={item.suffix}
      actions={item.actions}
      selected={isSelected}
      subtitle={item.subtitle}
      description={item.description}
      onClick={onClick}
      onPointerMove={onPointerMove}
    />
  );
}

const UiListGroupHeading = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
  return (
    <span
      {...props}
      ref={ref}
      className={cn(
        'px-2 py-1.5 text-xs font-medium text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  );
});
UiListGroupHeading.displayName = 'UiListGroupHeading';

const uiListItemActionColors: Record<
  Required<UiListItemAction>['color'],
  string
> = {
  default: '',
  primary: 'text-primary',
  destructive: 'text-destructive-text',
};
function UiListItemActions({ actions }: { actions: UiListItemAction[] }) {
  const listStore = useUiListStore();
  const actionIndex = useUiList((state) => state.selectedItem.actionIndex);

  const [openTooltip, setOpenTooltip] = useState(-1);

  useEffect(() => {
    setOpenTooltip(actionIndex);
  }, [actionIndex]);
  useEffect(() => {
    if (!actions || actions.length === 0) return;

    listStore.setSelectedItem(
      {
        actions: actions.map((action) => ({
          value: action.value,
          shortcut: action.shortcut,
          onAction: action.onAction,
        })),
      },
      false,
    );
  }, [actions, listStore]);

  return (
    <div className="flex items-center absolute rounded-sm top-0 h-full right-0 pr-2 pl-6 pointer-events-none bg-gradient-to-tl from-40% from-card to-100% to-transparent">
      {actions.map(
        (
          { icon: Icon, onAction, title, value, shortcut, color = 'default' },
          index,
        ) => (
          <UiTooltip
            key={value}
            align="end"
            sideOffset={4}
            open={openTooltip === index}
            label={`${title} ${getShortcutStr(shortcut)}`}
            onOpenChange={(isOpen) => setOpenTooltip(isOpen ? index : -1)}
          >
            <button
              tabIndex={-1}
              aria-pressed={actionIndex === index}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                onAction?.();
              }}
              className="h-9 w-9 aria-pressed:bg-secondary hover:bg-secondary rounded-sm inline-flex items-center justify-center pointer-events-auto"
            >
              <Icon
                className={`h-4 w-4 ${uiListItemActionColors[color ?? 'default'] ?? ''}`}
              />
            </button>
          </UiTooltip>
        ),
      )}
    </div>
  );
}

interface UiListItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  value?: string;
  selected?: boolean;
  actions?: UiListItemAction[];
  icon?: string | React.ReactNode;
  title: string | React.ReactNode;
  alias?: string | React.ReactNode;
  suffix?: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  description?: string | React.ReactNode;
  onSelected?: (value: string | undefined) => void;
}
const UiListItem = forwardRef<HTMLDivElement, UiListItemProps>(
  (
    {
      icon,
      alias,
      title,
      value,
      suffix,
      actions,
      onClick,
      subtitle,
      selected,
      children,
      className,
      onSelected,
      description,
      ...props
    },
    ref,
  ) => {
    const elementRef = useRef<HTMLDivElement>(null);

    const mergedRef = mergeRefs(ref, elementRef);

    useEffect(() => {
      const element = elementRef.current;
      if (!element) return;

      const onSelectedEvent = () => onSelected?.(value);
      element.addEventListener(ITEM_SELECTED_EVENT, onSelectedEvent);

      return () => {
        element.removeEventListener(ITEM_SELECTED_EVENT, onSelectedEvent);
      };
    }, [onSelected, value]);

    return (
      // eslint-disable-next-line jsx-a11y/interactive-supports-focus, jsx-a11y/click-events-have-key-events
      <div
        className={cn(
          'relative group/item min-h-12 flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-card aria-selected:text-accent-foreground',
          className,
        )}
        {...props}
        aria-selected={selected}
        ref={mergedRef}
        data-item-value={value}
        role="option"
        onClick={(event) => {
          if (!onSelected) onClick?.(event);
          else onSelected(value);
        }}
      >
        {children ? (
          children
        ) : (
          <>
            {icon && (
              <span className="h-8 w-8 mr-2 inline-flex items-center justify-center group-aria-selected/item:text-foreground text-muted-foreground">
                {icon}
              </span>
            )}
            <div className="flex-1">
              <p className="leading-tight line-clamp-1">
                {title}
                <span className="text-muted-foreground leading-tight ml-2 text-xs">
                  {subtitle}
                </span>
                {alias && (
                  <span className="text-muted-foreground leading-tight ml-2 text-xs">
                    • {alias}
                  </span>
                )}
              </p>
              <span className="text-muted-foreground leading-tight">
                {description}
              </span>
            </div>
            {suffix}
            {actions && actions.length > 0 && selected && (
              <UiListItemActions actions={actions} />
            )}
          </>
        )}
      </div>
    );
  },
);
UiListItem.displayName = 'UiListItem';

const UiListIcon = forwardRef<
  HTMLSpanElement,
  Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> & {
    icon: LucideIcon | string;
  }
>(({ icon: Icon, className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        'group-aria-selected/item:text-foreground text-muted-foreground inline-flex justify-center items-center bg-card rounded-sm border border-border/40 h-full w-full',
        className,
      )}
      {...props}
    >
      {typeof Icon === 'string' ? Icon : <Icon className="h-4 w-4" />}
    </span>
  );
});
UiListIcon.displayName = 'ExtCommandListIcon';

const UiListInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ onKeyDown, onChange, ...props }, ref) => {
  const listStore = useUiListStore();
  const query = useUiList((state) => state.search);

  return (
    <input
      ref={ref}
      {...props}
      value={query}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        listStore.listControllerKeyBind(event.nativeEvent);
      }}
      onChange={(event) => {
        onChange?.(event);
        listStore.setState('search', event.target.value);
      }}
    />
  );
});
UiListInput.displayName = 'ExtCommandListIcon';

export const UiList = Object.assign(UiListRoot, {
  Icon: UiListIcon,
  Item: UiListItem,
  Input: UiListInput,
  GroupHeading: UiListGroupHeading,
});
