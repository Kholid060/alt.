import { UiList, UiSkeleton } from '@altdot/ui';
import { useDatabaseQuery } from '/@/hooks/useDatabase';
import { CommandListItemWorkflow } from '/@/interface/command.interface';
import ListItemWorkflow from '/@/components/list-item/ListItemWorkflow';

function CommandWorkflowsList() {
  const workflows = useDatabaseQuery(
    'database:get-workflow-list',
    [{ limit: 10, sort: { by: 'isPinned', asc: false } }],
    {
      transform(data): CommandListItemWorkflow[] {
        return data.map((workflow) => {
          return {
            group: '',
            icon: workflow.icon,
            title: workflow.name,
            subtitle: 'Workflow',
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
