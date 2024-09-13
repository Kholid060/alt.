import { UiButton, UiDialog, UiTooltip } from '@altdot/ui';
import {
  CalendarIcon,
  ChevronLeftIcon,
  HistoryIcon,
  TimerIcon,
} from 'lucide-react';
import { useDatabaseQuery } from '/@/hooks/useDatabase';
import WorkflowHistoryTable from '../../workflow-history/WorkflowHistoryTable';
import preloadAPI from '/@/utils/preloadAPI';
import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import WorkflowHistoryDetail from '../../workflow-history/WorkflowHistoryDetail';
import WorkflowHistoryStatusBadge from '../../workflow-history/WorkflowHistoryStatusBadge';
import { formatDuration } from '/@/utils/helper';
import { useReactFlow, useStoreApi } from '@xyflow/react';

function WorkflowHistoryContent({
  workflowId,
  onCloseDialog,
}: {
  workflowId: string;
  onCloseDialog?: () => void;
}) {
  const workflowHistory = useDatabaseQuery(
    'database:get-workflow-history-list',
    [
      {
        filter: { workflowId },
        pagination: { page: 1, pageSize: 15 },
        sort: { by: 'startedAt', asc: false },
      },
    ],
  );

  const storeApi = useStoreApi();
  const reactFlow = useReactFlow();

  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(
    null,
  );

  const selectedHistory = useMemo(() => {
    if (!selectedHistoryId || !workflowHistory.data) return null;

    return workflowHistory.data.items.find(
      (item) => item.id === selectedHistoryId,
    );
  }, [selectedHistoryId, workflowHistory.data]);

  function onNodeClicked(nodeId: string) {
    const node = reactFlow.getNode(nodeId);
    if (!node) return;

    onCloseDialog?.();

    reactFlow.setCenter(node.position.x, node.position.y);
    storeApi.getState().addSelectedNodes([node.id]);
  }

  return (
    <>
      <UiDialog.Header className="px-6 pt-6">
        {selectedHistory ? (
          <div className="flex gap-3">
            <UiButton
              variant="secondary"
              className="h-full"
              size="icon"
              onClick={() => setSelectedHistoryId(null)}
            >
              <ChevronLeftIcon />
            </UiButton>
            <div className="flex-1">
              <UiDialog.Title>{selectedHistory.runnerId}</UiDialog.Title>
              <div className="mt-2 flex items-center gap-6 text-sm text-muted-foreground">
                <WorkflowHistoryStatusBadge status={selectedHistory.status} />
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
            </div>
          </div>
        ) : (
          <UiDialog.Title>Recent Workflow History</UiDialog.Title>
        )}
      </UiDialog.Header>
      <div
        className="overflow-auto pb-6"
        style={{ maxHeight: 'calc(100vh - 15rem)' }}
      >
        {selectedHistory ? (
          <div className="border-t pt-6 text-sm">
            <WorkflowHistoryDetail
              history={selectedHistory}
              onNodeClicked={onNodeClicked}
            />
          </div>
        ) : (
          <div className="px-6">
            <WorkflowHistoryTable
              className="w-full text-sm"
              onDeleteHistory={(history) =>
                preloadAPI.main.ipc.invoke(
                  'database:delete-workflow-history',
                  history.id,
                )
              }
              onHistorySelected={(history) => setSelectedHistoryId(history.id)}
              items={workflowHistory.data?.items ?? []}
            />
          </div>
        )}
      </div>
    </>
  );
}

function WorkflowEditorLogs({ workflowId }: { workflowId: string }) {
  const runningWorkflows = useDatabaseQuery('database:get-running-workflows', [
    { workflowId },
  ]);

  const [showDialog, setShowDialog] = useState(false);

  return (
    <div className="rounded-md border border-border/60 bg-secondary">
      <UiTooltip label="Workflow history">
        <UiButton
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setShowDialog(true)}
        >
          {runningWorkflows.data && runningWorkflows.data.length > 0 && (
            <span className="pointer-events-none absolute -left-2 -top-2 inline-flex size-5 items-center justify-center rounded-full bg-primary p-1 text-xs">
              {runningWorkflows.data.length}
            </span>
          )}
          <HistoryIcon className="h-5 w-5" />
        </UiButton>
      </UiTooltip>
      <UiDialog modal open={showDialog} onOpenChange={setShowDialog}>
        <UiDialog.Content className="max-w-4xl p-0" blurBg={false}>
          <WorkflowHistoryContent
            workflowId={workflowId}
            onCloseDialog={() => setShowDialog(false)}
          />
        </UiDialog.Content>
      </UiDialog>
    </div>
  );
}

export default WorkflowEditorLogs;
