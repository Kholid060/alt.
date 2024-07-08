import { WorkflowNodeLoop } from '@altdot/workflow';
import { UiSelect, UiLabel, UiInput } from '@altdot/ui';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import { WORKFLOW_NODE_TYPE } from '@altdot/workflow';
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
      <UiSelect
        inputSize="sm"
        id="loop--data-source"
        value={data.dataSource}
        onValueChange={(value) =>
          updateEditNode({ dataSource: value as DataSource })
        }
      >
        {dataSource.map((item) => (
          <UiSelect.Option value={item.id} key={item.id}>
            {item.name}
          </UiSelect.Option>
        ))}
      </UiSelect>
      {content}
    </WorkflowNodeLayoutEdit>
  );
}
WorkflowNodeEditLoop.type = WORKFLOW_NODE_TYPE.LOOP;

export default WorkflowNodeEditLoop;
