import { WorkflowNodeExecuteWorkflow } from '#packages/common/interface/workflow-nodes.interface';
import {
  UiInput,
  UiLabel,
  UiList,
  UiListItem,
  UiSwitch,
  UiTextarea,
  UiTooltip,
} from '@repo/ui';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import WorkflowUiFormExpression from '../ui/WorkflowUiFormExpression';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/workflow.const';
import { useDatabaseQuery } from '/@/hooks/useDatabase';
import { useEffect, useMemo } from 'react';
import {
  UiListProvider,
  useUiListStore,
} from '@repo/ui/dist/context/list.context';
import { InfoIcon } from 'lucide-react';

function WorkflowCombobox({
  data,
  items,
  onUpdateWorkflowId,
}: {
  items: UiListItem[];
  data: WorkflowNodeExecuteWorkflow['data'];
  onUpdateWorkflowId: (value: string) => void;
}) {
  const listStore = useUiListStore();

  useEffect(() => {
    listStore.setState('search', data.workflowId);
  }, [data.workflowId]);

  return (
    <div className="relative group/combobox">
      <UiInput
        value={data.workflowId}
        id="execute-workflow--workflow-id"
        inputSize="sm"
        placeholder="Select workflow"
        onKeyDown={(event) => {
          listStore.listControllerKeyBind(event.nativeEvent);
        }}
        onChange={(event) => {
          onUpdateWorkflowId(event.target.value);
        }}
      />
      <UiList
        items={items}
        renderItem={({ item, props, ref, selected }) => (
          <UiList.Item
            ref={ref}
            {...{ ...props, ...item, selected }}
            subtitle=""
            tabIndex={-1}
            className="aria-selected:bg-secondary text-sm"
            onKeyDown={() => onUpdateWorkflowId(item.value)}
            onSelected={() => onUpdateWorkflowId(item.value)}
          />
        )}
        className="absolute bg-popover w-full rounded-md border p-1 mt-1 group-focus-within/combobox:block hidden max-h-80 overflow-auto"
      />
    </div>
  );
}

function WorkflowNodeEditDelay() {
  const node =
    useWorkflowEditorStore.use.editNode() as WorkflowNodeExecuteWorkflow;
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();
  const workflowId = useWorkflowEditorStore((state) => state.workflow?.id);

  const workflows = useDatabaseQuery('database:get-workflow-list', [
    'commands',
  ]);
  const filteredWorkflows = useMemo<UiListItem[]>(() => {
    if (!workflowId || !workflows.data) return [];

    return workflows.data.reduce<UiListItem[]>((acc, workflow) => {
      if (workflow.id !== workflowId) {
        acc.push({
          value: workflow.id,
          title: workflow.name,
          description: workflow.id,
          subtitle: workflow.id,
        });
      }

      return acc;
    }, []);
  }, [workflows.data, workflowId]);

  return (
    <WorkflowNodeLayoutEdit node={node}>
      <div className="space-y-4">
        <UiListProvider>
          <WorkflowUiFormExpression
            data={node.data.$expData}
            label="Workflow id"
            path="workflowId"
            labelId="execute-workflow--workflow-id"
            onDataChange={($expData) => updateEditNode({ $expData })}
          >
            <WorkflowCombobox
              data={node.data}
              items={filteredWorkflows}
              onUpdateWorkflowId={(workflowId) =>
                updateEditNode<WorkflowNodeExecuteWorkflow>({ workflowId })
              }
            />
          </WorkflowUiFormExpression>
        </UiListProvider>
        <section>
          <WorkflowUiFormExpression
            data={node.data.$expData}
            label="Expose variables"
            path="delayMs"
            description="variable names of the current workflow that will be exposed to the sub-workflow"
            labelId="execute-workflow--expose-var"
            onDataChange={($expData) => updateEditNode({ $expData })}
          >
            <UiTextarea
              value={node.data.exposeVars}
              id="execute-workflow--expose-var"
              placeholder="var1,var2,var3..."
              onChange={(event) =>
                updateEditNode({ exposeVars: event.target.value })
              }
            />
          </WorkflowUiFormExpression>
          <p className="text-xs text-muted-foreground ml-1">
            Use commas to separate the variable name. Use{' '}
            <code className="bg-card px-1 rounded border select-all">
              $$all
            </code>{' '}
            to expose all variables
          </p>
        </section>
        <section className="group/var">
          <div className="flex items-center justify-between">
            <UiLabel className="ml-1" htmlFor="clipboard-assign-var">
              Assign last node value to variable
              <UiTooltip
                label="Assign the last node value of the sub-workflow to a variable"
                className="max-w-xs"
              >
                <InfoIcon className="h-4 w-4 text-muted-foreground inline-block align-sub ml-1 invisible group-hover/var:visible" />
              </UiTooltip>
            </UiLabel>
            <UiSwitch
              size="sm"
              id="clipboard-assign-var"
              checked={node.data.insertToVar}
              onCheckedChange={(insertToVar) =>
                updateEditNode<WorkflowNodeExecuteWorkflow>({ insertToVar })
              }
            />
          </div>
          <UiInput
            value={node.data.varName}
            min={0}
            inputSize="sm"
            className="mt-1"
            placeholder="Variable name"
            disabled={!node.data.insertToVar}
            onValueChange={(value) =>
              updateEditNode<WorkflowNodeExecuteWorkflow>({ varName: value })
            }
          />
        </section>
      </div>
    </WorkflowNodeLayoutEdit>
  );
}
WorkflowNodeEditDelay.type = WORKFLOW_NODE_TYPE.EXECUTE_WORKFLOW;

export default WorkflowNodeEditDelay;
