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
  KeyboardShortcut,
  getShortcutStr,
  KeyboardShortcutModifier,
} from '@repo/shared';
import mergeRefs from '@/utils/mergeRefs';

const ITEM_SELECTED_EVENT = 'ui-list-item-selected';

export interface UiListItemAction {
  title: string;
  value: string;
  icon: LucideIcon;
  onAction: () => void;
  shortcut?: KeyboardShortcut;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface UiListItem<T = any> {
  value: string;
  title: string;
  metadata?: T;
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
  disabledItemSelection?: boolean;
  onItemSelected?: (item: UiListItem) => void;
  customFilter?: (items: UiListItem[], query: string) => UiListItem[];
  renderGroupHeader?: (label: string, index: number) => React.ReactNode;
  renderItem?: (
    detail: {
      selected: boolean;
      item: UiListItem;
      ref: React.Ref<HTMLDivElement>;
      props: Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>;
    },
    index: number,
  ) => React.ReactNode;
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
      { minRanking: matchSorter.rankings.EQUAL, key: 'subtitle' },
    ],
  });
}

const UiListRoot = forwardRef<UiListRef, UiListProps>(
  (
    {
      items,
      search,
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

    const containerRef = useRef<HTMLDivElement>(null);

    const filteredItems = useMemo<UiListFlatItems>(() => {
      let itemList: UiListItem[] = items;
      if (shouldFilter && query?.trim()) {
        itemList = customFilter
          ? customFilter(itemList, query)
          : uiListItemsFilter(itemList, query);
      }

      const groupedItems: (UiListItem | [string, UiListItem[]])[] = [];
      const groupIndexMap = new Map<string, number>();

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

      return groupedItems.flat(2);
    }, [query, shouldFilter, items, customFilter]);
    const controller = useMemo<UiListController>(() => {
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
              shortcut: action.shortcut,
            })) ?? [],
        });
      };

      return {
        selectItem() {
          const { index, actionIndex } = listStore.snapshot().selectedItem;
          const currentItem = filteredItems[index];

          if (!currentItem || typeof currentItem === 'string') return;

          if (
            actionIndex >= 0 &&
            currentItem.actions &&
            currentItem.actions[actionIndex]
          ) {
            currentItem.actions[actionIndex].onAction();
            return;
          }

          const itemEl = document.querySelector<HTMLElement>(
            `[data-item-value="${currentItem.value}"]`,
          );
          itemEl?.dispatchEvent(new Event(ITEM_SELECTED_EVENT));

          onItemSelected?.(currentItem);
          currentItem.onSelected?.();
        },
        runActionByShortcut(event) {
          const { index } = listStore.snapshot().selectedItem;
          const item = filteredItems[index];
          if (
            !item ||
            typeof item === 'string' ||
            !item.actions ||
            item.actions.length === 0
          )
            return false;

          const { altKey, ctrlKey, metaKey, shiftKey } = event;
          if (!altKey && !ctrlKey && !metaKey && !shiftKey) return false;

          const checkShortcutMod = (mod: KeyboardShortcutModifier) => {
            if (mod === 'mod') return ctrlKey || metaKey;

            return event[mod];
          };
          const itemAction = item.actions.find(({ shortcut }) => {
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
    }, [filteredItems]);

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

        listStore.setSelectedItem({
          index,
          id: item.value,
          actionIndex: -1,
          metadata: item.metadata,
          actions:
            item.actions?.map((action) => ({
              value: action.value,
              shortcut: action.shortcut,
            })) ?? [],
        });
      },
      [onItemSelected],
    );
    const onItemClick = useCallback(
      (item: UiListItem) => {
        item.onSelected?.();
        onItemSelected?.(item);
      },
      [onItemSelected],
    );

    useEffect(() => {
      if (disabledItemSelection) return;

      controller.firstItem();
      listStore.setController(controller);

      return () => {
        listStore.setController(null);
      };
    }, [filteredItems, disabledItemSelection]);
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
    }, []);

    return (
      <div ref={containerRef} {...props}>
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

function UiListItemActions({ actions }: { actions: UiListItemAction[] }) {
  const actionIndex = useUiList((state) => state.selectedItem.actionIndex);
  const [openTooltip, setOpenTooltip] = useState(-1);

  useEffect(() => {
    setOpenTooltip(actionIndex);
  }, [actionIndex]);

  return (
    <div className="flex items-center absolute rounded-sm top-0 h-full right-0 pr-2 bg-card">
      {actions.map(
        ({ icon: Icon, onAction, title, value, shortcut }, index) => (
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
              className="h-9 w-9 aria-pressed:bg-secondary hover:bg-secondary rounded-sm inline-flex items-center justify-center"
            >
              <Icon className="h-5 w-5" />
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
  suffix?: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  onSelected?: (value: string | undefined) => void;
  description?: string | React.ReactNode;
}
const UiListItem = forwardRef<HTMLDivElement, UiListItemProps>(
  (
    {
      icon,
      title,
      value,
      suffix,
      actions,
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
      <div
        className={cn(
          'relative group/item min-h-12 flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-card aria-selected:text-accent-foreground',
          className,
        )}
        {...props}
        aria-selected={selected}
        ref={mergedRef}
        data-item-value={value}
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
              <p className="leading-tight">
                {title}
                <span className="text-muted-foreground leading-tight ml-2 text-xs">
                  {subtitle}
                </span>
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

const UiListIcon = forwardRef<HTMLSpanElement, { icon: LucideIcon | string }>(
  ({ icon: Icon }, ref) => {
    return (
      <span
        ref={ref}
        className="group-aria-selected/item:text-foreground text-muted-foreground inline-flex justify-center items-center bg-card rounded-sm border border-border/40 h-full w-full"
      >
        {typeof Icon === 'string' ? Icon : <Icon className="h-4 w-4" />}
      </span>
    );
  },
);
UiListIcon.displayName = 'ExtCommandListIcon';

const UiList = Object.assign(UiListRoot, {
  Icon: UiListIcon,
  Item: UiListItem,
  GroupHeading: UiListGroupHeading,
});

export default UiList;
