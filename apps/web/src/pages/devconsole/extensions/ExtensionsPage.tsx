import { UiButton, UiSkeleton } from '@alt-dot/ui';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import APIService from '@/services/api.service';
import dayjs from 'dayjs';
import ExtensionStatus from '@/components/extension/ExtensionStatus';
import { ExtensionDetailIcon } from '@/components/extension/ExtensionDetail';

function ExtensionsList() {
  const query = useQuery({
    refetchInterval: false,
    refetchOnWindowFocus: false,
    queryKey: ['me-extensions'],
    queryFn: () => APIService.instance.me.listExtensions(),
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
            className="min-w-32 mt-4"
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
          className="p-3 text-muted-foreground text-sm text-center"
        >
          No data
        </td>
      </tr>
    );
  }

  return (query.data ?? []).map((item) => (
    <tr
      key={item.id}
      className="hover:bg-card border-b border-border/50 last:border-b-0"
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
            <p className="text-sm text-muted-foreground leading-tight">
              v{item.version}
            </p>
          </div>
        </Link>
      </td>
      <td className="p-3">
        <p>{dayjs(item.updatedAt).format('DD MMM YYYY, HH:mm')}</p>
      </td>
      <td className="p-3 text-left">
        <p className="tabular-nums">{item.downloadCount}x</p>
      </td>
      <td className="p-3 text-right">
        <ExtensionStatus
          rejectReason={item.entry?.rejectReason}
          status={item.entry?.status ?? 'published'}
        />
      </td>
    </tr>
  ));
}

function DevConsoleExtensionsPage() {
  return (
    <div className="rounded-lg border w-full overflow-x-auto overflow-y-hidden">
      <table className="w-full">
        <thead className="text-sm border-b h-12 w-full">
          <tr className="text-left">
            <th className="h-12 px-4 w-5/12 min-w-56">Name</th>
            <th className="h-12 px-4 w-3/12 min-w-32">Last updated</th>
            <th className="h-12 px-4 w-2/12 text-left min-w-32">
              Downloads count
            </th>
            <th className="h-12 px-4 w-2/12 min-w-32"></th>
          </tr>
        </thead>
        <tbody>
          <ExtensionsList />
        </tbody>
      </table>
    </div>
  );
}

export default DevConsoleExtensionsPage;
