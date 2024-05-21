import { WorkflowNodeErroHandlerAction } from '#packages/common/interface/workflow.interface';
import { UiInput, UiLabel, UiSelect, UiSwitch } from '@repo/ui';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import { WorkflowNodeErrorHandler as WorkflowNodeErrorHandlerType } from '#packages/common/interface/workflow-nodes.interface';

const errorActions: { title: string; id: WorkflowNodeErroHandlerAction }[] = [
  { id: 'stop', title: 'Stop execution' },
  { id: 'continue', title: 'Continue execution' },
  { id: 'fallback', title: 'Execute fallback node' },
];
const defaultErrorHandler: WorkflowNodeErrorHandlerType = {
  action: 'stop',
  retry: false,
  retryCount: 3,
  retryIntervalMs: 1000,
};

function WorkflowNodeErrorHandler({
  data,
}: {
  data?: WorkflowNodeErrorHandlerType;
}) {
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  const errorHandler = data || defaultErrorHandler;

  function updateErrorHandler(data: Partial<WorkflowNodeErrorHandlerType>) {
    updateEditNode({
      $errorHandler: { ...errorHandler, ...data },
    });
  }

  return (
    <>
      <section className="grid grid-cols-2 items-center justify-between gap-4">
        <UiLabel htmlFor="error--retry-switch">Retry on error</UiLabel>
        <div className="text-right">
          <UiSwitch
            size="sm"
            id="error--retry-switch"
            checked={errorHandler.retry}
            onCheckedChange={(checked) =>
              updateErrorHandler({ retry: checked })
            }
          />
        </div>
        {errorHandler.retry && (
          <>
            <UiLabel htmlFor="error--retry-count">Retry count</UiLabel>
            <UiInput
              type="number"
              inputSize="sm"
              placeholder="3"
              id="error--retry-count"
              onChange={({ target }) =>
                updateErrorHandler({
                  retryCount: Math.max(target.valueAsNumber, 1),
                })
              }
              value={errorHandler.retryCount}
            />
            <UiLabel htmlFor="error--retry-interval">
              Retry interval (MS)
            </UiLabel>
            <UiInput
              id="error--retry-interval"
              type="number"
              inputSize="sm"
              placeholder="1000"
              value={errorHandler.retryIntervalMs}
              onChange={({ target }) =>
                updateErrorHandler({
                  retryIntervalMs: Math.max(target.valueAsNumber, 100),
                })
              }
            />
          </>
        )}
      </section>
      <hr className="my-4" />
      <UiLabel htmlFor="error-handler-select" className="ml-1">
        On error
      </UiLabel>
      <UiSelect
        value={errorHandler.action}
        id="error-handler-select"
        inputSize="sm"
        onValueChange={(value) => {
          updateErrorHandler({
            action: value as WorkflowNodeErroHandlerAction,
          });
        }}
      >
        {errorActions.map((action) => (
          <UiSelect.Option value={action.id} key={action.id}>
            {action.title}
          </UiSelect.Option>
        ))}
      </UiSelect>
    </>
  );
}

export default WorkflowNodeErrorHandler;
