import { useEffect, useState } from 'react';
import { useDatabase } from '/@/hooks/useDatabase';
import { useDebounceValue } from 'usehooks-ts';
import {
  UiBadge,
  UiButton,
  UiInput,
  UiPopover,
  UiPopoverContent,
  UiPopoverTrigger,
  UiSelect,
  useToast,
} from '@altdot/ui';
import {
  ArrowDownAzIcon,
  ArrowUpAzIcon,
  LoaderIcon,
  SearchIcon,
  TrashIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { WORKFLOW_HISTORY_STATUS } from '#packages/common/utils/constant/workflow.const';
import dayjs from 'dayjs';
import preloadAPI from '/@/utils/preloadAPI';
import { isIPCEventError } from '#packages/common/utils/helper';
import UiItemsPagination from '/@/components/ui/UiItemsPagination';
import {
  WorkflowHistoryListPaginationFilter,
  WorkflowHistoryModel,
} from '#packages/main/src/workflow/workflow-history/workflow-history.interface';
import { WORKFLOW_NODES, WORKFLOW_NODE_TYPE } from '@altdot/workflow';

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

function WorkflowHistoryError({ item }: { item: WorkflowHistoryModel }) {
  let nodeId = '';
  let nodeName = '';

  if (item.errorLocation) {
    let type = '';
    [type, nodeId] = item.errorLocation.split(':');

    nodeName = WORKFLOW_NODES[type as WORKFLOW_NODE_TYPE]?.title ?? 'Node';
  }

  return (
    <>
      {nodeName && nodeId && (
        <p className="mb-2 text-sm">
          Error occured on the{' '}
          <Link
            to={`/workflows/${item.workflowId}?toNode=${nodeId}`}
            className="underline"
          >
            &quot;{nodeName}&quot;
          </Link>{' '}
          node
        </p>
      )}
      <pre className="whitespace-pre-wrap rounded-md bg-background p-2 text-sm">
        {item.errorMessage!}
      </pre>
    </>
  );
}

function RouteWorkflowHistory() {
  const { toast } = useToast();
  const { queryDatabase } = useDatabase();

  const [search, setSearch] = useDebounceValue('', 500);
  const [workflowHistory, setWorkflowHistory] = useState<{
    count: number;
    items: WorkflowHistoryModel[];
  }>({ count: 0, items: [] });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
  });
  const [sort, setSort] = useState<HistorySort>({
    asc: false,
    by: 'startedAt',
  });

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
                  <Link
                    className="block p-3"
                    to={`/workflows/${item.workflowId}`}
                  >
                    <p>{item.workflow.name}</p>
                    <p className="leading-tight text-muted-foreground">
                      {item.runnerId}
                    </p>
                  </Link>
                </td>
                <td className="p-3 text-center">
                  <WorkflowHistoryStatusBadge status={item.status} />
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
                    {item.errorMessage && (
                      <UiPopover>
                        <UiPopoverTrigger className="h-8 underline">
                          see error
                        </UiPopoverTrigger>
                        <UiPopoverContent
                          side="left"
                          className="max-h-72 w-80 overflow-auto"
                        >
                          <WorkflowHistoryError item={item} />
                        </UiPopoverContent>
                      </UiPopover>
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
    </div>
  );
}

export default RouteWorkflowHistory;
