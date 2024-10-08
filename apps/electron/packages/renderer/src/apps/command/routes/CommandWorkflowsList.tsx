import { UiList, UiSkeleton } from '@altdot/ui';
import { useDatabaseQuery } from '/@/hooks/useDatabase';
import { CommandListItemWorkflow } from '/@/interface/command.interface';
import ListItemWorkflow from '/@/components/list-item/ListItemWorkflow';
import { useCommandPanelHeader } from '/@/hooks/useCommandPanelHeader';
import { WorkflowIcon } from 'lucide-react';

function CommandWorkflowsList() {
  useCommandPanelHeader({
    subtitle: 'Utils',
    title: 'Workflows list',
    icon: <WorkflowIcon className="mr-2 h-4 w-4" />,
  });

  const workflows = useDatabaseQuery(
    'database:get-workflow-list',
    [{ limit: 10, sort: { by: 'isPinned', asc: false } }],
    {
      transform(data): CommandListItemWorkflow[] {
        return data
          .sort((a, z) => (a.updatedAt > z.updatedAt ? -1 : 1))
          .map((workflow) => {
            return {
              group: workflow.isPinned ? 'Pinned' : 'All',
              icon: workflow.icon,
              title: workflow.name,
              value: `workflow:${workflow.id}`,
              metadata: {
                type: 'workflow',
                workflowId: workflow.id,
                isPinned: workflow.isPinned ?? false,
              },
            };
          });
      },
    },
  );

  return (
    <div className="p-2">
      {workflows.state === 'loading' ? (
        <div className="space-y-1">
          <UiSkeleton className="h-9" />
          <UiSkeleton className="h-9" />
          <UiSkeleton className="h-9" />
          <UiSkeleton className="h-9" />
        </div>
      ) : workflows.state === 'error' ? (
        <p className="text-center text-destructive-text">
          Something went wrong when loading workflows
        </p>
      ) : (
        <UiList
          items={workflows.data}
          noDataSlot={
            <p className="my-4 text-center text-sm text-muted-foreground">
              No workflows
            </p>
          }
          renderItem={({ ref, item, ...detail }) => (
            <ListItemWorkflow
              itemRef={ref}
              item={item as CommandListItemWorkflow}
              {...{ ...detail }}
            />
          )}
        />
      )}
    </div>
  );
}

export default CommandWorkflowsList;
