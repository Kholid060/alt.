import { WorkflowHistoryWithWorkflowModel } from '#packages/main/src/workflow/workflow-history/workflow-history.interface';
import { UiButton, UiTooltip } from '@altdot/ui';
import { forwardRef } from 'react';
import WorkflowHistoryStatusBadge from './WorkflowHistoryStatusBadge';
import { WORKFLOW_HISTORY_STATUS } from '#packages/common/utils/constant/workflow.const';
import dayjs from '/@/lib/dayjs';
import preloadAPI from '/@/utils/preloadAPI';
import { TrashIcon } from 'lucide-react';
import { formatDuration } from '/@/utils/helper';

interface WorkflowHistoryTableProps {
  items: WorkflowHistoryWithWorkflowModel[];
  onHistorySelected?: (history: WorkflowHistoryWithWorkflowModel) => void;
  onDeleteHistory?: (history: WorkflowHistoryWithWorkflowModel) => void;
}

const today = new Date();
function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  if (date.getDate() !== today.getDate()) {
    return dayjs(date).format('DD MMM, HH:mm');
  }

  return dayjs(date).fromNow();
}

const WorkflowHistoryTable = forwardRef<
  HTMLTableElement,
  WorkflowHistoryTableProps & React.TableHTMLAttributes<HTMLTableElement>
>(
  (
    { items, onHistorySelected: onItemSelected, onDeleteHistory, ...props },
    ref,
  ) => {
    return (
      <table {...props} ref={ref}>
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
          {items.length === 0 && (
            <tr>
              <td className="p-3 text-center text-muted-foreground" colSpan={9}>
                No data
              </td>
            </tr>
          )}
          {items.map((item) => (
            <tr
              key={item.id}
              className="group cursor-default border-b border-border/50 hover:bg-card"
            >
              <td>
                <button
                  className="block w-full p-3 text-left"
                  onClick={() => onItemSelected?.(item)}
                >
                  <p>{item.workflow.name}</p>
                  <p className="leading-tight text-muted-foreground">
                    {item.runnerId}
                  </p>
                </button>
              </td>
              <td className="p-3 text-center">
                {item.status === WORKFLOW_HISTORY_STATUS.Error ? (
                  <UiTooltip delayDuration={0} label={item.errorMessage}>
                    <div>
                      <WorkflowHistoryStatusBadge status={item.status} />
                    </div>
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
                    onClick={() => onDeleteHistory?.(item)}
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
    );
  },
);
WorkflowHistoryTable.displayName = 'WorkflowHistoryTable';

export default WorkflowHistoryTable;
