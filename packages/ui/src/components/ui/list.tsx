/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
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
  UiListSelectedItemAction,
  useUiList,
  useUiListStore,
} from '@/context/list.context';
import { matchSorter } from 'match-sorter';
import { cn } from '@/utils/cn';
import {
  getShortcutStr,
  KeyboardShortcut,
  KeyboardShortcutModifier,
} from '@altdot/shared';
import mergeRefs from '@/utils/mergeRefs';
import {
  UiDropdownMenu,
  UiDropdownMenuContent,
  UiDropdownMenuItem,
  UiDropdownMenuShortcut,
  UiDropdownMenuTrigger,
} from './dropdown-menu';

const ITEM_SELECTED_EVENT = 'ui-list-item-selected';

interface UiListItemActionBase {
  title: string;
  value: string;
  icon: LucideIcon;
  disabled?: boolean;
  shortcut?: KeyboardShortcut;
  color?: 'default' | 'primary' | 'destructive';
}

export interface UiListItemActionButton extends UiListItemActionBase {
  type: 'button';
  onAction: () => void;
}

export interface UiListItemActionMenu extends UiListItemActionBase {
  type: 'menu';
  items: UiListItemActionButton[];
}

export type UiListItemAction = UiListItemActionMenu | UiListItemActionButton;

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
  actions?: UiListItemAction[];
  suffix?: string | React.ReactNode;
}

type UiListGroupItem = [string, UiListItem[]];
type UiListFlatItems = (string | UiListItem)[];

export interface UiListProps
  extends Omit<React.DetailsHTMLAttributes<HTMLDivElement>, 'children'> {
  search?: string;
  items: UiListItem[];
  shouldFilter?: boolean;
  noDataSlot?: React.ReactNode;
  disabledItemSelection?: boolean;
  onItemSelected?: (value: string) => void;
  onSearchChanged?: (value: string) => void;
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
  props: Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
    onSelected?: () => void;
  };
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
function flattenActions(
  actions: UiListItemAction[],
  containerEl?: HTMLElement | null,
): UiListSelectedItemAction[] {
  return actions.flatMap<UiListSelectedItemAction>((action) => {
    if (action.type === 'menu') {
      return {
        isInMenu: false,
        value: action.value,
        shortcut: action.shortcut,
        items: action.items.map((item) => ({
          isInMenu: true,
          value: item.value,
          onAction: item.onAction,
          shortcut: item.shortcut,
        })),
        onAction() {
          const element = (containerEl || document.body).querySelector(
            `[data-action-id="${action.value}"]`,
          );
          if (!element) return;

          element.dispatchEvent(new PointerEvent('click', { bubbles: true }));
        },
      };
    }

    return {
      isInMenu: false,
      value: action.value,
      onAction: action.onAction,
      shortcut: action.shortcut,
    };
  });
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
      onSearchChanged,
      renderGroupHeader,
      shouldFilter = true,
      disabledItemSelection,
      ...props
    },
    ref,
  ) => {
    const listStore = useUiListStore();
    const query = useUiList((state) =>
      typeof search === 'string' ? search : state.search,
    );

    const itemsLen = useRef<number | null>(null);

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
          actions: flattenActions(
            item.actions ?? [],
            listStore.containerRef.current,
          ),
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

          const itemEl =
            listStore.containerRef.current?.querySelector<HTMLElement>(
              `[data-item-value="${id}"]`,
            );
          itemEl?.dispatchEvent(
            new CustomEvent(ITEM_SELECTED_EVENT, { detail: id, bubbles: true }),
          );
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
          const isMatchAction = (shortcut: KeyboardShortcut) => {
            const isModMatch =
              checkShortcutMod(shortcut.mod1) &&
              (shortcut.mod2 ? checkShortcutMod(shortcut.mod2) : true);
            const isKeyMatch =
              event.key.toLowerCase() === shortcut.key.toLowerCase();

            return isModMatch && isKeyMatch;
          };
          const itemAction = (() => {
            for (const action of actions) {
              if (action.items) {
                const matchAction = action.items.find(
                  (item) => item.shortcut && isMatchAction(item.shortcut),
                );
                if (matchAction) return matchAction;
              } else if (action.shortcut && isMatchAction(action.shortcut)) {
                return action;
              }
            }

            return null;
          })();

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
    }, [filteredItems, listStore]);

    useImperativeHandle(
      ref,
      () => ({ controller, el: listStore.containerRef }),
      [controller, listStore.containerRef],
    );

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
      if (!onSearchChanged || search) return;

      onSearchChanged(query);
    }, [onSearchChanged, search, query]);
    useEffect(() => {
      if (disabledItemSelection) return;

      if (controller.itemChanged) controller.firstItem();
      listStore.setController(controller);

      return () => {
        listStore.setController(null);
      };
    }, [disabledItemSelection, controller, listStore]);
    useEffect(() => {
      const onItemSelectedEvent = (event: Event) => {
        if (event instanceof CustomEvent) {
          onItemSelected?.(event.detail);
        }
      };
      listStore.containerRef.current?.addEventListener(
        ITEM_SELECTED_EVENT,
        onItemSelectedEvent,
      );

      return () => {
        listStore.containerRef.current?.removeEventListener(
          ITEM_SELECTED_EVENT,
          onItemSelectedEvent,
        );
        listStore.setSelectedItem({
          id: '',
          index: -1,
          actions: [],
          metadata: {},
          actionIndex: -1,
        });
      };
    }, [listStore, onItemSelected]);

    return (
      <div ref={listStore.containerRef} {...props}>
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

function scrollIntoView(el: Element, options: boolean | ScrollIntoViewOptions) {
  'scrollIntoViewIfNeeded' in el
    ? // @ts-expect-error chrome only method
      el.scrollIntoViewIfNeeded(false)
    : el.scrollIntoView(options);
}

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
      parentEl.firstElementChild === elRef.current &&
      parentEl.previousElementSibling
    ) {
      scrollIntoView(parentEl.previousElementSibling, {
        block: 'nearest',
      });
    }

    scrollIntoView(elRef.current, {
      block: 'nearest',
    });
  }, [isSelected]);

  if (renderItem) {
    return renderItem(
      {
        item,
        ref: elRef,
        selected: isSelected,
        props: {
          onClick,
          onPointerMove,
          onSelected: item.onSelected,
        },
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
      onSelected={item.onSelected}
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
const UiListItemActionsButton = forwardRef<
  HTMLButtonElement,
  {
    index: number;
    action: UiListItemAction;
  } & React.HTMLAttributes<HTMLButtonElement>
>(({ index, action, onClick, ...props }, ref) => {
  const isActive = useUiList(
    (state) => state.selectedItem.actionIndex === index,
  );

  return (
    <button
      ref={ref}
      tabIndex={-1}
      aria-pressed={isActive}
      onClick={(event) => {
        onClick?.(event);

        if (action.type === 'menu') return;

        event.preventDefault();
        event.stopPropagation();
        action.onAction?.();
      }}
      data-action-id={action.value}
      data-tooltip-open={isActive}
      data-tooltip={`${action.title} ${getShortcutStr(action.shortcut)}`}
      className="h-9 w-9 relative focus:outline-none focus:ring-primary focus:ring-2 focus:ring-offset-2 aria-pressed:ring-primary aria-pressed:ring-2 aria-pressed:ring-offset-2 ring-offset-background aria-pressed:bg-secondary hover:bg-secondary rounded-sm inline-flex items-center justify-center pointer-events-auto"
      {...props}
    >
      <action.icon
        className={`h-4 w-4 ${uiListItemActionColors[action.color ?? 'default'] ?? ''}`}
      />
    </button>
  );
});
UiListItemActionsButton.displayName = 'UiListItemActionsButton';
function UiListItemActionMenuComp({
  index,
  action,
}: {
  index: number;
  action: UiListItemActionMenu;
}) {
  const prevFocus = useRef<HTMLElement | null>(null);

  const [open, setOpen] = useState(false);

  function onCloseAutoFocus(event: Event) {
    event.preventDefault();
    prevFocus.current?.focus?.();
  }

  return (
    <UiDropdownMenu
      open={open}
      onOpenChange={(value) => !value && setOpen(false)}
    >
      <UiDropdownMenuTrigger asChild>
        <UiListItemActionsButton
          index={index}
          action={action}
          onClick={() => {
            setOpen(true);
            prevFocus.current = document.activeElement as HTMLElement;
          }}
        />
      </UiDropdownMenuTrigger>
      <UiDropdownMenuContent
        side="left"
        align="start"
        className="min-w-44 max-w-64"
        onCloseAutoFocus={onCloseAutoFocus}
      >
        {action.items.map((item) => (
          <UiDropdownMenuItem
            disabled={item.disabled}
            key={action.value + item.value}
            onClick={() => item.onAction()}
            variant={item.color === 'destructive' ? 'destructive' : undefined}
          >
            <item.icon className="mr-2 size-4" />
            <span className="line-clamp-1 flex-1">{item.title}</span>
            {item.shortcut && (
              <UiDropdownMenuShortcut className="ml-4">
                {getShortcutStr(item.shortcut)}
              </UiDropdownMenuShortcut>
            )}
          </UiDropdownMenuItem>
        ))}
      </UiDropdownMenuContent>
    </UiDropdownMenu>
  );
}
function UiListItemActions({ actions }: { actions: UiListItemAction[] }) {
  const listStore = useUiListStore();

  useEffect(() => {
    if (!actions || actions.length === 0) return;

    listStore.setSelectedItem(
      {
        actions: flattenActions(actions, listStore.containerRef.current),
      },
      false,
    );
  }, [actions, listStore]);

  return (
    <div className="flex items-center z-2 absolute rounded-sm top-0 h-full right-0 pr-2 pl-6 pointer-events-none bg-gradient-to-tl from-40% from-secondary dark:from-card to-100% to-transparent">
      {actions.map((action, index) => (
        <Fragment key={action.value}>
          {action.type === 'menu' ? (
            <UiListItemActionMenuComp action={action} index={index} />
          ) : (
            <UiListItemActionsButton action={action} index={index} />
          )}
        </Fragment>
      ))}
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

      const onSelectedEvent = (event: Event) => {
        if (event instanceof CustomEvent) {
          onSelected?.(event.detail);
        }
      };
      element?.addEventListener(ITEM_SELECTED_EVENT, onSelectedEvent);

      return () => {
        element?.removeEventListener(ITEM_SELECTED_EVENT, onSelectedEvent);
      };
    }, [onSelected]);

    return (
      <div
        className={cn(
          'relative group/item ui-list-item min-h-12 text-muted-foreground flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none dark:aria-selected:bg-card aria-selected:bg-secondary aria-selected:text-accent-foreground',
          className,
        )}
        {...props}
        aria-selected={selected}
        ref={mergedRef}
        data-item-value={value}
        role="option"
      >
        {children ? (
          children
        ) : (
          <>
            {icon && (
              <span className="h-8 w-8 mr-2 inline-flex items-center justify-center group-aria-selected/item:text-foreground flex-shrink-0">
                {icon}
              </span>
            )}
            <div className="flex-1 line-clamp-1">
              <p className="leading-tight line-clamp-1 w-full text-foreground">
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
              <span className="text-muted-foreground leading-tight text-xs">
                {description}
              </span>
            </div>
            {suffix}
            <div
              onClick={(event) => {
                if (!onSelected) onClick?.(event);
                else onSelected(value);
              }}
              className="absolute z-1 h-full w-full left-0 top-0"
            ></div>
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
