import { UiLabel, UiSelect, UiButton } from '@altdot/ui';
import clsx from 'clsx';

interface Pagination {
  page: number;
  pageSize: number;
}
interface UiPaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  autoHide?: boolean;
  itemsCount: number;
  pagination: Pagination;
  onPaginationChange?: (pagination: Pagination) => void;
}

function UiItemsPagination({
  className,
  itemsCount,
  pagination,
  autoHide = true,
  onPaginationChange,
  ...props
}: UiPaginationProps) {
  if (autoHide && itemsCount <= 10) return null;

  const maxPaginationPage = Math.ceil(itemsCount / pagination.pageSize);

  return (
    <div
      className={clsx(
        'mt-4 flex items-center text-sm text-muted-foreground',
        className,
      )}
      {...props}
    >
      <p className="tabular-nums">
        {pagination.page * pagination.pageSize - pagination.pageSize + 1}-
        {Math.min(pagination.page * pagination.pageSize, itemsCount)} of{' '}
        {itemsCount}
      </p>
      <div className="flex-grow"></div>
      <UiLabel htmlFor="pagination-select">Rows per page</UiLabel>
      <UiSelect
        className="ml-2 w-16"
        id="pagination-select"
        inputSize="sm"
        value={pagination.pageSize.toString()}
        onValueChange={(value) =>
          onPaginationChange?.({
            ...pagination,
            pageSize: +value,
          })
        }
      >
        <UiSelect.Option value="10">10</UiSelect.Option>
        <UiSelect.Option value="25">25</UiSelect.Option>
        <UiSelect.Option value="50">50</UiSelect.Option>
      </UiSelect>
      <hr className="mx-4 h-6 w-px bg-border" />
      <UiButton
        variant="outline"
        size="sm"
        disabled={pagination.page <= 1}
        onClick={() =>
          onPaginationChange?.({
            ...pagination,
            page: Math.max(pagination.page - 1, 1),
          })
        }
      >
        Prev
      </UiButton>
      <p className="mx-2 tabular-nums">
        {pagination.page}/{maxPaginationPage}
      </p>
      <UiButton
        variant="outline"
        size="sm"
        disabled={pagination.page >= maxPaginationPage}
        onClick={() =>
          onPaginationChange?.({
            ...pagination,
            page: Math.min(pagination.page + 1, maxPaginationPage),
          })
        }
      >
        Next
      </UiButton>
    </div>
  );
}

export default UiItemsPagination;
