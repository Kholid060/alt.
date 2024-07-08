import { WorkflowNodeErroHandlerAction } from '#packages/common/interface/workflow.interface';
import {
  UiInput,
  UiLabel,
  UiPopover,
  UiPopoverContent,
  UiPopoverTrigger,
  UiSelect,
  UiSwitch,
  UiTextarea,
  UiTooltip,
} from '@altdot/ui';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import {
  WorkflowNodeErrorHandler as WorkflowNodeErrorHandlerType,
  WorkflowNodes,
  WorkflowVariableMode,
} from '@altdot/workflow';
import React from 'react';
import { EllipsisVerticalIcon, InfoIcon } from 'lucide-react';

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
      <div className="mt-4 grid grid-cols-12 items-center justify-between gap-y-4">
        <UiLabel
          htmlFor="error--retry-switch"
          className="col-span-6 text-muted-foreground"
        >
          Retry on error
        </UiLabel>
        <div className="col-span-6 text-right">
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
              className="col-span-6 text-muted-foreground"
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
              className="col-span-6 text-muted-foreground"
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
          className="col-span-6 text-muted-foreground"
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

const WorkflowNodeOutput: SettingComponent = ({ data, onUpdate }) => {
  return (
    <>
      <p className="font-semibold">Output</p>
      <section className="group mt-4 grid grid-cols-12 items-center">
        <UiLabel
          htmlFor="output-var"
          className="col-span-6 text-muted-foreground"
        >
          Variable name
          <UiTooltip
            label="Name of the variable where the output value of the node will be assigned to"
            className="max-w-xs"
          >
            <InfoIcon className="invisible ml-1 inline h-4 w-4 group-focus-within:visible group-hover:visible" />
          </UiTooltip>
        </UiLabel>
        <div className="relative col-span-6">
          <UiInput
            inputSize="sm"
            id="output-var"
            className="w-full pr-6"
            placeholder="node_output"
            value={data.$outputVarName}
            onValueChange={(value) => onUpdate({ $outputVarName: value })}
          />
          <UiPopover>
            <UiPopoverTrigger className="absolute right-2 top-1/2 -translate-y-1/2">
              <EllipsisVerticalIcon className="h-4 w-4" />
            </UiPopoverTrigger>
            <UiPopoverContent align="end" className="text-sm">
              <UiLabel className="ml-1">Mode</UiLabel>
              <UiSelect
                inputSize="sm"
                value={data.$outputVarMode || 'replace'}
                onValueChange={(value) =>
                  onUpdate({ $outputVarMode: value as WorkflowVariableMode })
                }
              >
                <UiSelect.Option value="replace">Replace</UiSelect.Option>
                <UiSelect.Option value="append">Append</UiSelect.Option>
              </UiSelect>
            </UiPopoverContent>
          </UiPopover>
        </div>
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
