import {
  Fragment,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import * as fuzzySort from 'fuzzysort';
import { LucideIcon } from 'lucide-react';
import {
  UiListController,
  useUiList,
  useUiListStore,
} from '@/context/list.context';
import { cn } from '@/utils/cn';

export interface UiListItem {
  value: string;
  title: string;
  subtitle?: string;
  keywords?: string[];
  searchOnly?: boolean;
  icon?: React.ReactNode;
  onSelected?: () => void;
  detail?: React.ReactNode;
  metadata?: Record<string, unknown>;
}

export type UiListItemMatch = Fuzzysort.Result;

export interface UiListGroupItem<T = UiListItem> {
  items: T[];
  label: string;
  value?: string;
}

export type UiListItems = (UiListItem | UiListGroupItem)[];

export interface UiListProps
  extends Omit<React.DetailsHTMLAttributes<HTMLDivElement>, 'children'> {
  search?: string;
  items: UiListItems;
  selectedItem?: string;
  shouldFilter?: boolean;
  disabledItemSelection?: boolean;
  onItemSelected?: (item: UiListItem) => void;
  renderGroupHeader?: (label: string) => React.ReactNode;
  renderItem?: (detail: {
    selected: boolean;
    item: UiListItemQuery | UiListItem;
    props: Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>;
  }) => React.ReactNode;
}

export interface UiListItemQuery extends UiListItem {
  $score: number;
  $matches: Record<string, UiListItemMatch>;
}

interface UiListGroupItemQuery extends UiListGroupItem<UiListItemQuery> {
  $score: number;
}

type FilterItemResult = (UiListItemQuery | UiListGroupItemQuery)[];
function mapToResultItem(
  item: Fuzzysort.KeysResult<UiListItem>,
  score?: number,
): UiListItemQuery {
  return {
    ...item.obj,
    $score: score ?? item.score,
    $matches: { title: item[0] },
  };
}

function isSearchOnly(item: UiListItem | UiListItemQuery) {
  if ('$score' in item) return false;

  return item.searchOnly;
}
function findNonSearchOnlyItem(
  items: FilterItemResult | UiListItems,
  options?: Partial<{
    startIndex: number[];
    groupOnly: boolean;
    direction: 'prev' | 'next';
  }>,
): { item: UiListItem; index: number[] } | null {
  const { direction, groupOnly, startIndex } = {
    startIndex: [0],
    direction: 'next',
    groupOnly: false,
    ...options,
  };
  let [index, childIndex] = startIndex;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (
      (direction === 'next' && index > items.length - 1) ||
      (direction === 'prev' && index < 0)
    )
      return null;

    const currentItem = items[index];
    if (!currentItem) return null;

    const isGroup = 'items' in currentItem;
    if (isGroup && (typeof childIndex !== 'number' || childIndex >= 0)) {
      if (typeof childIndex !== 'number') {
        childIndex =
          direction === 'prev'
            ? ((currentItem as UiListGroupItem).items?.length ?? 1) - 1
            : 0;
      }

      while (childIndex >= 0 && childIndex <= currentItem.items.length - 1) {
        const groupItem = currentItem.items[childIndex];
        if (groupItem && !isSearchOnly(groupItem)) {
          return { item: groupItem, index: [index, childIndex] };
        }

        childIndex += direction === 'prev' ? -1 : 1;
      }
    } else if (!isGroup && !groupOnly && !isSearchOnly(currentItem)) {
      return { item: currentItem, index: [index] };
    }

    if (typeof childIndex === 'number') childIndex = 0;
    index += direction === 'next' ? 1 : -1;
  }
}

export interface UiListRef {
  controller: UiListController;
  el: React.RefObject<HTMLDivElement>;
}

const UiListRoot = forwardRef<UiListRef, UiListProps>(
  (
    {
      items,
      search,
      renderItem,
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

    const filteredItems = useMemo(() => {
      if (!shouldFilter || !query?.trim()) return items;

      const result: FilterItemResult = [];

      const searchOptions = {
        limit: 100,
        threshold: -20000,
        keys: ['title', 'keywords'],
      };

      for (const item of items) {
        if ('items' in item) {
          let totalScore = 0;
          const resultItems: UiListItemQuery[] = fuzzySort
            .go(query, item.items, searchOptions)
            .map((value) => {
              totalScore += value.score;
              return mapToResultItem(value, 0);
            });

          if (resultItems.length > 0) {
            result.push({
              label: item.label,
              $score: totalScore,
              items: resultItems,
            });
          }

          continue;
        }

        const [resulItem] = fuzzySort.go(query, [item], searchOptions) ?? [];
        if (resulItem) result.push(mapToResultItem(resulItem));
      }

      return result.sort((a, z) => z.$score - a.$score);
    }, [query, shouldFilter, items]);
    const controller = useMemo<UiListController>(() => {
      const setSelectedItem = (
        selectedItem: {
          index: number[];
          item: UiListItem;
        } | null,
      ) => {
        const { index, item } = selectedItem ?? {
          index: [],
          item: { value: '', metadata: {} },
        };
        listStore.setSelectedItem(item.value, index, item.metadata);
      };

      return {
        selectItem() {
          const [groupIndex, index] = listStore.snapshot().selectedItem.index;

          let currentItem = filteredItems[groupIndex];
          if (currentItem && 'items' in currentItem) {
            currentItem = currentItem.items[index];
          }

          if (!currentItem) return;

          onItemSelected?.(currentItem);
          currentItem.onSelected?.();
        },
        firstItem() {
          const firstItem = findNonSearchOnlyItem(filteredItems);
          setSelectedItem(firstItem);
        },
        lastItem() {
          const lastItem = findNonSearchOnlyItem(filteredItems, {
            direction: 'prev',
            startIndex: [filteredItems.length - 1],
          });
          if (!lastItem) return;

          setSelectedItem(lastItem);
        },
        nextGroup() {
          const [currentIndex] = listStore.snapshot().selectedItem.index;
          if (currentIndex === filteredItems.length - 1) return;

          const nextGroup = findNonSearchOnlyItem(filteredItems, {
            groupOnly: true,
            startIndex: [currentIndex + 1],
          });
          if (!nextGroup) return;

          setSelectedItem(nextGroup);
        },
        prevGroup() {
          const [currentIndex] = listStore.snapshot().selectedItem.index;
          if (currentIndex === 0) return;

          const prevGroup = findNonSearchOnlyItem(filteredItems, {
            groupOnly: true,
            startIndex: [currentIndex - 1],
          });
          if (!prevGroup) return;

          setSelectedItem(prevGroup);
        },
        nextItem() {
          const [groupIndex, index] = listStore.snapshot().selectedItem.index;
          const nextItem = findNonSearchOnlyItem(filteredItems, {
            startIndex:
              typeof index === 'number'
                ? [groupIndex, index + 1]
                : [groupIndex + 1],
          });
          if (!nextItem) return;

          setSelectedItem(nextItem);
        },
        prevItem() {
          const [groupIndex, index] = listStore.snapshot().selectedItem.index;
          const prevItem = findNonSearchOnlyItem(filteredItems, {
            direction: 'prev',
            startIndex:
              typeof index === 'number'
                ? [groupIndex, index - 1]
                : [groupIndex - 1],
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
      (item: UiListItem, indexs: number[]) => {
        if (
          disabledItemSelection ||
          listStore.snapshot().selectedItem.id === item.value
        )
          return;

        listStore.setSelectedItem(item.value, indexs, item.metadata);
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
    }, [filteredItems, disabledItemSelection]);
    useEffect(() => {
      return () => {
        listStore.setSelectedItem('', []);
      };
    }, []);

    return (
      <div ref={containerRef} {...props}>
        {filteredItems.map((item, index) => {
          if ('items' in item) {
            return (
              <Fragment key={item.label}>
                {renderGroupHeader ? (
                  renderGroupHeader(item.label)
                ) : (
                  <UiListGroupHeading key={item.value || item.label}>
                    {item.label}
                  </UiListGroupHeading>
                )}
                <div className="group-list">
                  {item.items.map((groupItem, groupIndex) =>
                    groupItem.searchOnly && !query?.trim() ? null : (
                      <UiListItemRenderer
                        item={groupItem}
                        index={groupIndex}
                        key={groupItem.value}
                        value={groupItem.value}
                        renderItem={renderItem}
                        onClick={() => onItemClick(groupItem)}
                        onPointerMove={() =>
                          onPointerMove(groupItem, [index, groupIndex])
                        }
                      />
                    ),
                  )}
                </div>
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
              onPointerMove={() => onPointerMove(item, [index])}
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
  onClick,
  renderItem,
  onPointerMove,
}: {
  value: string;
  index: number;
  item: UiListItemQuery | UiListItem;
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
    return renderItem({
      item,
      selected: isSelected,
      props: { onPointerMove, onClick },
    });
  }

  return (
    <UiListItem
      ref={elRef}
      icon={item.icon}
      title={item.title}
      value={item.value}
      selected={isSelected}
      subtitle={item.subtitle}
      onClick={onClick}
      onPointerMove={onPointerMove}
    />
  );
}

const UiListHighlightResult = memo(
  ({
    match,
    children,
    ...props
  }: React.HTMLAttributes<HTMLSpanElement> & { match: UiListItemMatch }) => {
    const highlights = fuzzySort.highlight(match, (m, i) => (
      <span key={i} {...props}>
        {m}
      </span>
    ));
    if (!highlights) return children;

    return <>{highlights.map((char) => char)}</>;
  },
);
UiListHighlightResult.displayName = 'UiListGroupHeading';

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

interface UiListItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  value?: string;
  selected?: boolean;
  icon?: string | React.ReactNode;
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
}
const UiListItem = forwardRef<HTMLDivElement, UiListItemProps>(
  (
    { title, icon, subtitle, selected, className, value, children, ...props },
    ref,
  ) => {
    return (
      <div
        className={cn(
          'relative group min-h-11 flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-secondary aria-selected:text-accent-foreground',
          className,
        )}
        {...props}
        aria-selected={selected}
        ref={ref}
      >
        {children ? (
          children
        ) : (
          <>
            {icon && (
              <span className="h-8 w-8 mr-2 inline-flex items-center justify-center group-aria-selected:text-foreground text-muted-foreground">
                {icon}
              </span>
            )}
            <div className="flex-1">
              <p className="leading-tight">{title}</p>
              <p className="text-muted-foreground leading-tight">{subtitle}</p>
            </div>
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
        className="group-aria-selected:bg-secondary-hover group-aria-selected:text-foreground text-muted-foreground inline-flex justify-center items-center bg-secondary rounded-sm border border-border/40 h-full w-full"
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
