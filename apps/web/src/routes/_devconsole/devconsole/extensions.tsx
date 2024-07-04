import { ExtensionDetailIcon } from '@/components/extension/ExtensionDetail';
import ExtensionStatus from '@/components/extension/ExtensionStatus';
import APIService from '@/services/api.service';
import {
  UiSkeleton,
  UiButton,
  UiDropdownMenu,
  UiDropdownMenuTrigger,
  UiDropdownMenuContent,
  UiDropdownMenuItem,
} from '@alt-dot/ui';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { EllipsisIcon } from 'lucide-react';

const queryData = queryOptions({
  queryKey: ['me-extensions'],
  queryFn: () => APIService.instance.me.listExtensions(),
});

export const Route = createFileRoute('/_devconsole/devconsole/extensions')({
  component: DevConsoleExtensionsPage,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(queryData);
  },
});

const numberFormatter = new Intl.NumberFormat();

function ExtensionsList() {
  const query = useQuery({
    refetchInterval: false,
    refetchOnWindowFocus: false,
    ...queryData,
  });

  if (query.isPending) {
    return (
      <>
        <tr>
          <td colSpan={50} className="px-3 pt-3">
            <UiSkeleton className="h-10" />
          </td>
        </tr>
        <tr>
          <td colSpan={50} className="px-3 py-2">
            <UiSkeleton className="h-10" />
          </td>
        </tr>
        <tr>
          <td colSpan={50} className="px-3 pb-3">
            <UiSkeleton className="h-10" />
          </td>
        </tr>
      </>
    );
  }
  if (query.isError) {
    return (
      <tr>
        <td colSpan={50} className="p-3 text-center">
          <p className="text-sm text-destructive-text">
            Failed to fetch extensions list
          </p>
          <UiButton
            size="sm"
            variant="secondary"
            className="mt-4 min-w-32"
            onClick={() => query.refetch()}
          >
            Retry
          </UiButton>
        </td>
      </tr>
    );
  }
  if (query.data && query.data.length === 0) {
    return (
      <tr>
        <td
          colSpan={50}
          className="p-3 text-center text-sm text-muted-foreground"
        >
          No data
        </td>
      </tr>
    );
  }

  return (query.data ?? []).map((item) => (
    <tr
      key={item.id}
      className="border-b border-border/50 last:border-b-0 hover:bg-card"
    >
      <td className="p-3">
        <Link className="flex items-center" to={item.id}>
          <ExtensionDetailIcon
            className="size-5"
            imageClass="h-[38px] w-[38px]"
            title={item.title}
            icon={item.iconUrl}
            iconUrl={item.iconUrl}
          />
          <div className="ml-3">
            <p className="leading-tight">{item.title}</p>
            <p className="text-sm leading-tight text-muted-foreground">
              v{item.version}
            </p>
          </div>
        </Link>
      </td>
      <td className="p-3">
        <p>{dayjs(item.updatedAt).format('DD MMM YYYY, HH:mm')}</p>
      </td>
      <td className="p-3 text-left">
        <p className="tabular-nums">
          {numberFormatter.format(item.downloadCount)}x
        </p>
      </td>
      <td className="p-3 text-right">
        <ExtensionStatus
          rejectReason={item.entry?.rejectReason}
          status={item.entry?.status ?? 'published'}
          className="align-middle"
        />
        <UiDropdownMenu>
          <UiDropdownMenuTrigger asChild>
            <UiButton
              className="ml-2 align-middle"
              variant="ghost"
              size="icon-sm"
            >
              <EllipsisIcon className="size-5" />
            </UiButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent asChild align="end">
            <a
              href={`/store/extensions/${item.name}/${item.id}`}
              className={clsx(
                'block',
                item.entry?.status &&
                  item.entry.status !== 'published' &&
                  'pointer-events-none opacity-60',
              )}
              target="_blank"
              rel="noreferrer"
            >
              <UiDropdownMenuItem>Open in store</UiDropdownMenuItem>
            </a>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </td>
    </tr>
  ));
}

function DevConsoleExtensionsPage() {
  return (
    <div className="w-full overflow-x-auto overflow-y-hidden rounded-lg border">
      <table className="w-full">
        <thead className="h-12 w-full border-b text-sm">
          <tr className="text-left">
            <th className="h-12 w-5/12 min-w-56 px-4">Name</th>
            <th className="h-12 w-3/12 min-w-32 px-4">Last updated</th>
            <th className="h-12 w-2/12 min-w-32 px-4 text-left">
              <span className="line-clamp-1">Downloads count</span>
            </th>
            <th className="h-12 w-2/12 min-w-40 px-4"></th>
          </tr>
        </thead>
        <tbody>
          <ExtensionsList />
        </tbody>
      </table>
    </div>
  );
}
