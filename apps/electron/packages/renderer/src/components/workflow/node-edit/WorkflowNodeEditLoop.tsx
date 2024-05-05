import { WorkflowNodeLoop } from '#packages/common/interface/workflow-nodes.interface';
import {
  UiList,
  UiTabs,
  UiTabsList,
  UiTabsTrigger,
  UiTabsContent,
  UiSelect,
  UiLabel,
  UiInput,
} from '@repo/ui';
import WorkflowNodeErrorHandler from './WorklflowNodeErrorHandler';
import { useWorkflowEditorStore } from '/@/stores/workflow-editor.store';
import { WORKFLOW_NODES } from '/@/utils/constant/workflow-nodes';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
import { WorkflowUiExpressionInput } from '../ui/WorkflowUiFormExpression';

type DataSource = WorkflowNodeLoop['data']['dataSource'];

const dataSource: {
  id: DataSource;
  name: string;
}[] = [
  { id: 'prev-node', name: 'Previous node' },
  { id: 'variable', name: 'Variable' },
  { id: 'expression', name: 'Expression' },
];

function WorkflowNodeEditLoop() {
  const { data } = useWorkflowEditorStore.use.editNode() as WorkflowNodeLoop;
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  const nodeData = WORKFLOW_NODES[WORKFLOW_NODE_TYPE.LOOP];

  let content: React.ReactNode = null;
  if (data.dataSource === 'expression') {
    content = (
      <div className="mt-3">
        <UiLabel className="ml-1" htmlFor="loop-variable-name">
          Expression
        </UiLabel>
        <WorkflowUiExpressionInput
          value={data.expression}
          labelId="loop--expression"
          onValueChange={(value) => updateEditNode({ expression: value })}
        />
      </div>
    );
  } else if (data.dataSource === 'variable') {
    content = (
      <div className="mt-3">
        <UiLabel className="ml-1" htmlFor="loop-variable-name">
          Variable name
        </UiLabel>
        <UiInput
          value={data.varName}
          inputSize="sm"
          id="loop--variable-name"
          placeholder="variable_name"
          onChange={({ target }) => updateEditNode({ varName: target.value })}
        />
      </div>
    );
  }

  return (
    <>
      <div className="p-4 pb-2 flex items-center gap-2">
        <div className="h-10 w-10">
          <UiList.Icon icon={nodeData.icon} />
        </div>
        <div className="flex-grow">
          <p className="leading-tight">{nodeData.title} </p>
          <p className="text-sm text-muted-foreground">{nodeData.subtitle}</p>
        </div>
      </div>
      <UiTabs variant="line" defaultValue="parameters">
        <UiTabsList>
          <UiTabsTrigger value="parameters">Parameters</UiTabsTrigger>
          <UiTabsTrigger value="error">Error Handler</UiTabsTrigger>
        </UiTabsList>
        <UiTabsContent value="parameters" className="p-4 mt-0">
          <UiLabel htmlFor="loop--data-source" className="ml-1">
            Data source
          </UiLabel>
          <UiSelect.Native
            inputSize="sm"
            id="loop--data-source"
            value={data.dataSource}
            onChange={({ target }) =>
              updateEditNode({ dataSource: target.value as DataSource })
            }
          >
            {dataSource.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </UiSelect.Native>
          {content}
        </UiTabsContent>
        <UiTabsContent value="error" className="p-4 mt-0">
          <WorkflowNodeErrorHandler data={data.$errorHandler} />
        </UiTabsContent>
      </UiTabs>
    </>
  );
}

export const nodeType = WORKFLOW_NODE_TYPE.LOOP;

export default WorkflowNodeEditLoop;
