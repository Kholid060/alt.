import { WorkflowNodeErroHandlerAction } from '#packages/common/interface/workflow.interface';
import {
  UiInput,
  UiLabel,
  UiSelect,
  UiSwitch,
  UiTextarea,
  UiTooltip,
} from '@repo/ui';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import {
  WorkflowNodeErrorHandler as WorkflowNodeErrorHandlerType,
  WorkflowNodes,
} from '#packages/common/interface/workflow-nodes.interface';
import React from 'react';
import { InfoIcon } from 'lucide-react';

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

type SettingComponent = React.FC<{
  data: WorkflowNodes['data'];
  onUpdate: (data: Partial<WorkflowNodes['data']>) => void;
}>;

const WorkflowNodeErrorHandler: SettingComponent = ({ data, onUpdate }) => {
  const errorHandler = data.$errorHandler || defaultErrorHandler;

  function updateErrorHandler(data: Partial<WorkflowNodeErrorHandlerType>) {
    onUpdate({
      $errorHandler: { ...errorHandler, ...data },
    });
  }

  return (
    <section>
      <p className="font-semibold">Error Handler</p>
      <div className="grid grid-cols-12 items-center justify-between gap-y-4 mt-4">
        <UiLabel
          htmlFor="error--retry-switch"
          className="text-muted-foreground col-span-6"
        >
          Retry on error
        </UiLabel>
        <div className="text-right col-span-6">
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
            <UiLabel
              htmlFor="error--retry-count"
              className="text-muted-foreground col-span-6"
            >
              Retry count
            </UiLabel>
            <UiInput
              type="number"
              inputSize="sm"
              placeholder="3"
              className="col-span-6"
              id="error--retry-count"
              onChange={({ target }) =>
                updateErrorHandler({
                  retryCount: Math.max(target.valueAsNumber, 1),
                })
              }
              value={errorHandler.retryCount}
            />
            <UiLabel
              htmlFor="error--retry-interval"
              className="text-muted-foreground col-span-6"
            >
              Retry interval (MS)
            </UiLabel>
            <UiInput
              id="error--retry-interval"
              type="number"
              inputSize="sm"
              placeholder="1000"
              className="col-span-6"
              value={errorHandler.retryIntervalMs}
              onChange={({ target }) =>
                updateErrorHandler({
                  retryIntervalMs: Math.max(target.valueAsNumber, 100),
                })
              }
            />
          </>
        )}
        <UiLabel
          htmlFor="error-handler-select"
          className="text-muted-foreground col-span-6"
        >
          On error
        </UiLabel>
        <UiSelect
          value={errorHandler.action}
          id="error-handler-select"
          inputSize="sm"
          className="col-span-6"
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
      </div>
    </section>
  );
};

const WorkflowNodeOutput: SettingComponent = () => {
  return (
    <>
      <p className="font-semibold">Output</p>
      <section className="grid grid-cols-12 mt-4 items-center group">
        <UiLabel
          htmlFor="output-var"
          className="text-muted-foreground col-span-6"
        >
          Variable name
          <UiTooltip
            label="Name of the variable where the output value of the node will be assigned to"
            className="max-w-xs"
          >
            <InfoIcon className="h-4 w-4 inline ml-1 invisible group-hover:visible group-focus-within:visible" />
          </UiTooltip>
        </UiLabel>
        <UiInput
          inputSize="sm"
          placeholder="node_output"
          id="output-var"
          className="col-span-6"
        />
      </section>
    </>
  );
};

function WorkflowNodeSettings({ data }: { data: WorkflowNodes['data'] }) {
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  return (
    <>
      <UiLabel htmlFor="node--description" className="ml-1">
        Description
      </UiLabel>
      <UiTextarea
        id="node--description"
        placeholder="Node description"
        value={data.description}
        onChange={(event) =>
          updateEditNode({ description: event.target.value })
        }
      />
      <hr className="my-4" />
      <WorkflowNodeErrorHandler data={data} onUpdate={updateEditNode} />
      <hr className="my-4" />
      <WorkflowNodeOutput data={data} onUpdate={updateEditNode} />
    </>
  );
}

export default WorkflowNodeSettings;
