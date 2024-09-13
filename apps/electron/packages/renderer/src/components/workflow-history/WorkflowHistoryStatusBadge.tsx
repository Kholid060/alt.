import { WORKFLOW_HISTORY_STATUS } from '#packages/common/utils/constant/workflow.const';
import { UiBadge } from '@altdot/ui';
import { LoaderIcon } from 'lucide-react';
import { forwardRef } from 'react';

const WorkflowHistoryStatusBadge = forwardRef<
  HTMLDivElement,
  { status: WORKFLOW_HISTORY_STATUS }
>(({ status }, ref) => {
  switch (status) {
    case WORKFLOW_HISTORY_STATUS.Error:
      return (
        <UiBadge ref={ref} variant="destructive">
          Error
        </UiBadge>
      );
    case WORKFLOW_HISTORY_STATUS.Finish:
      return <UiBadge ref={ref}>Finish</UiBadge>;
    case WORKFLOW_HISTORY_STATUS.Running:
      return (
        <UiBadge ref={ref} variant="outline" className="text-yellow-400">
          <LoaderIcon className="mr-1 h-4 w-4 animate-spin" />
          Running
        </UiBadge>
      );
    default:
      return null;
  }
});
WorkflowHistoryStatusBadge.displayName = 'WorkflowHistoryStatusBadge';

export default WorkflowHistoryStatusBadge;
