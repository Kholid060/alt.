import { WorkflowNodeLoop } from '#packages/common/interface/workflow-nodes.interface';
import { UiSelect, UiLabel, UiInput } from '@repo/ui';
import { useWorkflowEditorStore } from '/@/stores/workflow-editor.store';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
import { WorkflowUiExpressionInput } from '../ui/WorkflowUiFormExpression';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';

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
  const node = useWorkflowEditorStore.use.editNode() as WorkflowNodeLoop;
  const { data } = node;

  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

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
    <WorkflowNodeLayoutEdit node={node}>
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
    </WorkflowNodeLayoutEdit>
  );
}

export const nodeType = WORKFLOW_NODE_TYPE.LOOP;

export default WorkflowNodeEditLoop;
