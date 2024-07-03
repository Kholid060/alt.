import { UiDialog } from '@alt-dot/ui';
import { UiListProvider } from '@alt-dot/ui/dist/context/list.context';
import { useNavigate } from '@tanstack/react-router';
import WorkflowSelect from '../workflow/WorkflowSelect';

function DevConsoleNewWorkflow({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();

  return (
    <UiDialog open onOpenChange={(value) => !value && onClose?.()}>
      <UiDialog.Content className="sm:max-w-[425px] z-[101]">
        <UiDialog.Header>
          <UiDialog.Title>Share workflow</UiDialog.Title>
          <UiDialog.Description>
            Select a workflow you want to share
          </UiDialog.Description>
        </UiDialog.Header>
        <UiListProvider>
          <WorkflowSelect
            onSelected={(workflow) => {
              navigate({
                to: '/devconsole/workflows/new',
                state: { newWorkflow: workflow },
              });
            }}
          />
        </UiListProvider>
      </UiDialog.Content>
    </UiDialog>
  );
}

export default DevConsoleNewWorkflow;
