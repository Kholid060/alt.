import { useEffect, useMemo, useState } from 'react';
import { useDatabase } from '/@/hooks/useDatabase';
import { useDebounceValue } from 'usehooks-ts';
import { UiButton, UiDialog, UiInput, UiSelect, useToast } from '@altdot/ui';
import {
  ArrowDownAzIcon,
  ArrowUpAzIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  SearchIcon,
  TimerIcon,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from '/@/lib/dayjs';
import preloadAPI from '/@/utils/preloadAPI';
import { isIPCEventError } from '#packages/common/utils/helper';
import UiItemsPagination from '/@/components/ui/UiItemsPagination';
import {
  WorkflowHistoryListPaginationFilter,
  WorkflowHistoryWithWorkflowModel,
} from '#packages/main/src/workflow/workflow-history/workflow-history.interface';
import { useDocumentTitle } from '/@/hooks/useDocumentTitle';
import WorkflowHistoryTable from '/@/components/workflow-history/WorkflowHistoryTable';
import WorkflowHistoryStatusBadge from '/@/components/workflow-history/WorkflowHistoryStatusBadge';
import WorkflowHistoryDetail from '/@/components/workflow-history/WorkflowHistoryDetail';

function formatDuration(duration: number) {
  if (duration < 5000) return 'Less than 5 seconds';
  if (duration < 60_000) return `${Math.round(duration / 1000)} seconds`;

  return `${Math.round(duration / 1000 / 60)} minutes`;
}

type HistorySort = Required<WorkflowHistoryListPaginationFilter>['sort'];

function RouteWorkflowHistory() {
  useDocumentTitle('Workflow history');

  const { toast } = useToast();
  const navigate = useNavigate();
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
        <WorkflowHistoryTable
          className="w-full"
          items={workflowHistory.items}
          onDeleteHistory={(item) => deleteHistory(item.id)}
          onHistorySelected={(item) => setSelectedHistoryId(item.id)}
        />
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
              <div
                className="w-full overflow-auto border-t py-6 text-sm"
                style={{ maxHeight: 'calc(100vh - 15rem)' }}
              >
                <WorkflowHistoryDetail
                  history={selectedHistory}
                  className="w-full"
                  onNodeClicked={(nodeId) =>
                    navigate(
                      `/workflows/${selectedHistory.workflowId}?toNode=${nodeId}`,
                    )
                  }
                />
              </div>
            </>
          )}
        </UiDialog.Content>
      </UiDialog>
    </div>
  );
}

export { RouteWorkflowHistory as Component };
