import { useEffect, useMemo, useState } from 'react';
import { useDatabase } from '/@/hooks/useDatabase';
import { useDebounceValue } from 'usehooks-ts';
import {
  UiBadge,
  UiButton,
  UiDialog,
  UiInput,
  UiSelect,
  UiTooltip,
  useToast,
} from '@altdot/ui';
import {
  ArrowDownAzIcon,
  ArrowUpAzIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  LoaderIcon,
  SearchIcon,
  TimerIcon,
  TrashIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { WORKFLOW_HISTORY_STATUS } from '#packages/common/utils/constant/workflow.const';
import dayjs from '/@/lib/dayjs';
import preloadAPI from '/@/utils/preloadAPI';
import { isIPCEventError } from '#packages/common/utils/helper';
import UiItemsPagination from '/@/components/ui/UiItemsPagination';
import {
  WorkflowHistoryListPaginationFilter,
  WorkflowHistoryLogItem,
  WorkflowHistoryWithWorkflowModel,
} from '#packages/main/src/workflow/workflow-history/workflow-history.interface';
import { WORKFLOW_NODES } from '@altdot/workflow';

function WorkflowHistoryStatusBadge({
  status,
}: {
  status: WORKFLOW_HISTORY_STATUS;
}) {
  switch (status) {
    case WORKFLOW_HISTORY_STATUS.Error:
      return <UiBadge variant="destructive">Error</UiBadge>;
    case WORKFLOW_HISTORY_STATUS.Finish:
      return <UiBadge>Finish</UiBadge>;
    case WORKFLOW_HISTORY_STATUS.Running:
      return (
        <UiBadge variant="outline" className="text-yellow-400">
          <LoaderIcon className="mr-1 h-4 w-4 animate-spin" />
          Running
        </UiBadge>
      );
    default:
      return null;
  }
}

const today = new Date();
function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  if (date.getDate() !== today.getDate()) {
    return dayjs(date).format('DD MMM, HH:mm');
  }

  return dayjs(date).fromNow();
}
function formatDuration(duration: number) {
  if (duration < 5000) return 'Less than 5 seconds';
  if (duration < 60_000) return `${Math.round(duration / 1000)} seconds`;

  return `${Math.round(duration / 1000 / 60)} minutes`;
}

type HistorySort = Required<WorkflowHistoryListPaginationFilter>['sort'];

const logLevelClass: Record<string, string> = {
  default: 'hover:bg-card',
  error: 'hover:bg-destructive/25 bg-destructive/20 text-destructive-text',
};
function WorkflowHistoryDetail({
  history,
}: {
  history: WorkflowHistoryWithWorkflowModel;
}) {
  const [log, setlog] = useState<WorkflowHistoryLogItem[]>([]);

  useEffect(() => {
    preloadAPI.main.ipc
      .invokeWithError('workflow-history:get-log', history.runnerId)
      .then(setlog);
  }, [history.runnerId]);

  return (
    <div
      className="overflow-auto border-t py-6 font-mono text-sm text-muted-foreground"
      style={{ maxHeight: 'calc(100vh - 15rem)' }}
    >
      <table className="h-full w-full align-top">
        <thead>
          <tr>
            <th className="w-32"></th>
            <th className="w-40"></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {log.length === 0 && (
            <tr>
              <td colSpan={99} className="text-center">
                No log data
              </td>
            </tr>
          )}
          {log.map((item) => (
            <tr
              key={item.id}
              className={
                'align-top ' +
                (logLevelClass[item.level] ?? logLevelClass.default)
              }
            >
              <td className="py-1.5 pl-6 pr-2">{item.time}</td>
              <td className="line-clamp-1 px-2 py-1.5">
                {item.node && (
                  <Link
                    title={
                      (WORKFLOW_NODES[item.node.type]?.title ??
                        item.node.type) + ' node'
                    }
                    className="hover:text-foreground"
                    to={`/workflows/${history.workflowId}?toNode=${item.node.id}`}
                  >
                    <ArrowUpRightIcon className="mr-1 inline-block size-4 align-middle" />
                    <span className="align-middle">
                      {WORKFLOW_NODES[item.node.type]?.title ?? item.node.type}
                    </span>
                  </Link>
                )}
              </td>
              <td className="py-1.5 pl-2 pr-6">{item.msg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RouteWorkflowHistory() {
  const { toast } = useToast();
  const { queryDatabase } = useDatabase();

  const [search, setSearch] = useDebounceValue('', 500);
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(
    null,
  );
  const [workflowHistory, setWorkflowHistory] = useState<{
    count: number;
    items: WorkflowHistoryWithWorkflowModel[];
  }>({ count: 0, items: [] });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
  });
  const [sort, setSort] = useState<HistorySort>({
    asc: false,
    by: 'startedAt',
  });

  const selectedHistory = useMemo(() => {
    if (!selectedHistoryId) return null;

    return workflowHistory.items.find((item) => item.id === selectedHistoryId);
  }, [selectedHistoryId, workflowHistory]);

  function deleteHistory(historyId: number) {
    preloadAPI.main.ipc
      .invoke('database:delete-workflow-history', historyId)
      .then((result) => {
        if (isIPCEventError(result)) {
          toast({
            title: 'Error!',
            variant: 'destructive',
            description: result.message,
          });
          return;
        }

        setWorkflowHistory({
          ...workflowHistory,
          items: workflowHistory.items.filter((item) => item.id !== historyId),
        });
      });
  }

  useEffect(
    () =>
      queryDatabase({
        name: 'database:get-workflow-history-list',
        args: [
          { filter: search ? { name: search } : undefined, pagination, sort },
        ],
        onData(data) {
          setWorkflowHistory(data);
        },
        onError(message) {
          console.error(message);
        },
      }),
    [queryDatabase, search, pagination, sort],
  );

  return (
    <div className="container p-8">
      <h2 className="-mt-0.5 text-2xl font-semibold leading-tight">
        Workflow history
      </h2>
      <div className="mt-8 flex items-center">
        <UiInput
          defaultValue={search}
          prefixIcon={<SearchIcon className="h-5 w-5" />}
          className="w-64"
          type="search"
          placeholder="Search..."
          onValueChange={setSearch}
        />
        <div className="ml-4 flex items-center rounded-md border text-sm">
          <UiButton
            variant="outline"
            size="icon"
            className="flex-shrink-0 border-0"
            onClick={() =>
              setSort((prevVal) => ({ ...prevVal, asc: !prevVal.asc }))
            }
          >
            {sort.asc ? (
              <ArrowDownAzIcon className="h-5 w-5" />
            ) : (
              <ArrowUpAzIcon className="h-5 w-5" />
            )}
          </UiButton>
          <hr className="h-6 w-px bg-border" />
          <UiSelect
            value={sort.by}
            className="border-0 bg-background px-2"
            placeholder="Sort by"
            onValueChange={(value) =>
              setSort((prevValue) => ({
                ...prevValue,
                by: value as HistorySort['by'],
              }))
            }
          >
            <UiSelect.Option value="name">Name</UiSelect.Option>
            <UiSelect.Option value="duration">Duration</UiSelect.Option>
            <UiSelect.Option value="startedAt">Started date</UiSelect.Option>
          </UiSelect>
        </div>
      </div>
      <div className="mt-4 rounded-lg border text-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left">
              <th className="h-12 min-w-48 px-3">Workflow</th>
              <th className="h-12 px-3 text-center">Status</th>
              <th className="h-12 px-3">Started at</th>
              <th className="h-12 px-3">Duration</th>
              <th className="h-12 w-36 px-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {workflowHistory.items.length === 0 && (
              <tr>
                <td
                  className="p-3 text-center text-muted-foreground"
                  colSpan={9}
                >
                  No data
                </td>
              </tr>
            )}
            {workflowHistory.items.map((item) => (
              <tr
                key={item.id}
                className="group cursor-default border-b border-border/50 hover:bg-card"
              >
                <td>
                  <button
                    className="block w-full p-3 text-left"
                    onClick={() => setSelectedHistoryId(item.id)}
                  >
                    <p>{item.workflow.name}</p>
                    <p className="leading-tight text-muted-foreground">
                      {item.runnerId}
                    </p>
                  </button>
                </td>
                <td className="p-3 text-center">
                  {item.status === WORKFLOW_HISTORY_STATUS.Error ? (
                    <UiTooltip label={item.errorMessage}>
                      <WorkflowHistoryStatusBadge status={item.status} />
                    </UiTooltip>
                  ) : (
                    <WorkflowHistoryStatusBadge status={item.status} />
                  )}
                </td>
                <td className="p-3">{formatDate(item.startedAt)}</td>
                <td className="p-3">
                  {item.duration ? formatDuration(item.duration) : '-'}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-3">
                    {item.status === WORKFLOW_HISTORY_STATUS.Running && (
                      <UiButton
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          preloadAPI.main.ipc.invoke(
                            'workflow:stop-running',
                            item.runnerId,
                          )
                        }
                      >
                        Stop
                      </UiButton>
                    )}
                    <UiButton
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => deleteHistory(item.id)}
                      className="invisible group-hover:visible"
                    >
                      <TrashIcon className="h-5 w-5 text-destructive-text" />
                    </UiButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <UiItemsPagination
        autoHide
        pagination={pagination}
        itemsCount={workflowHistory.count}
        onPaginationChange={setPagination}
      />
      <UiDialog
        modal
        open={Boolean(selectedHistory)}
        onOpenChange={(value) => !value && setSelectedHistoryId(null)}
      >
        <UiDialog.Content className="max-w-5xl gap-0 p-0" blurBg={false}>
          {selectedHistory && (
            <>
              <div className="flex items-center p-6">
                <UiDialog.Header className="flex-grow space-y-3 pr-2">
                  <UiDialog.Title className="line-clamp-1">
                    {selectedHistory.workflow.name}
                  </UiDialog.Title>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <Link
                      to={`/workflows/${selectedHistory.workflowId}`}
                      className="inline-flex items-center transition-colors hover:text-foreground"
                    >
                      <ArrowUpRightIcon className="-ml-1 mr-1 size-5" />
                      Open
                    </Link>
                    <WorkflowHistoryStatusBadge
                      status={selectedHistory.status}
                    />
                    <span title="Duration">
                      <TimerIcon className="mr-2 inline-block size-5 align-middle" />
                      <span className="align-middle">
                        {formatDuration(selectedHistory.duration ?? 0)}
                      </span>
                    </span>
                    <span title="Started at">
                      <CalendarIcon className="mr-2 inline-block size-5 align-middle" />
                      <span className="align-middle">
                        {dayjs(selectedHistory.startedAt).fromNow()}
                      </span>
                    </span>
                  </div>
                </UiDialog.Header>
              </div>
              <WorkflowHistoryDetail history={selectedHistory} />
            </>
          )}
        </UiDialog.Content>
      </UiDialog>
    </div>
  );
}

export default RouteWorkflowHistory;
