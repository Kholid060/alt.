import { WorkflowNodeCommand } from '@altdot/workflow';
import { UiInput, UiList, UiSelect, UiSwitch } from '@altdot/ui';
import UiExtensionIcon from '../../ui/UiExtensionIcon';
import { useWorkflowEditorStore } from '/@/stores/workflow-editor/workflow-editor.store';
import { ChevronDown } from 'lucide-react';
import WorkflowUiFormExpression from '../ui/WorkflowUiFormExpression';
import { WORKFLOW_NODE_TYPE } from '@altdot/workflow/dist/const/workflow-nodes-type.const';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';

function CommandArgs({ data }: { data: WorkflowNodeCommand['data'] }) {
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  function updateArgValue(name: string, value: unknown) {
    updateEditNode({
      argsValue: {
        ...data.argsValue,
        [name]: value,
      },
    });
  }

  if (data.args.length === 0) {
    return <p className="text-center text-muted-foreground">No parameters</p>;
  }

  return (
    <ul className="space-y-3">
      {data.args.map((arg, index) => {
        let argComponent: React.ReactNode = null;

        switch (arg.type) {
          case 'select':
            argComponent = (
              <div className="relative flex items-center">
                <UiSelect.Native
                  inputSize="sm"
                  id={arg.name}
                  required={arg.required}
                  value={data.argsValue[arg.name] as string}
                  onChange={(event) => {
                    updateArgValue(arg.name, event.target.value);
                  }}
                >
                  <option value="" disabled>
                    {arg.placeholder || 'Select'}
                  </option>
                  {arg.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </UiSelect.Native>
                <ChevronDown className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2" />
              </div>
            );
            break;
          case 'input:text':
          case 'input:number':
          case 'input:password': {
            const { 1: type } = arg.type.split(':');
            argComponent = (
              <UiInput
                type={type}
                id={arg.name}
                inputSize="sm"
                className="w-full"
                required={arg.required}
                placeholder={arg.placeholder}
                value={data.argsValue[arg.name] as string}
                onChange={(event) => {
                  const target = event.target as HTMLInputElement;
                  updateArgValue(
                    arg.name,
                    type === 'number' ? target.valueAsNumber : target.value,
                  );
                }}
              />
            );
            break;
          }
          case 'toggle':
            argComponent = (
              <UiSwitch
                id={arg.name}
                size="sm"
                checked={Boolean(data.argsValue[arg.name])}
                onCheckedChange={(checked) => {
                  updateArgValue(arg.name, checked);
                }}
                className="data-[state=unchecked]:bg-secondary-selected"
              />
            );
            break;
        }

        return (
          <li key={data.extension.id + arg.name + index}>
            <WorkflowUiFormExpression
              label={arg.title}
              labelId={arg.name}
              data={data.$expData ?? {}}
              path={`argsValue.${arg.name}`}
              onDataChange={($expData) => updateEditNode({ $expData })}
            >
              {argComponent}
            </WorkflowUiFormExpression>
            <p className="ml-1 text-xs text-muted-foreground">
              {arg.description}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function WorkflowNodeEditCommand() {
  const node = useWorkflowEditorStore.use.editNode() as WorkflowNodeCommand;

  return (
    <WorkflowNodeLayoutEdit
      node={node}
      icon={
        <UiExtensionIcon
          alt={`${node.data.title} icon`}
          id={node.data.extension.id}
          icon={node.data.icon}
          iconWrapper={(icon) => <UiList.Icon icon={icon} />}
        />
      }
      title={node.data.title}
      subtitle={node.data.extension.title}
    >
      <CommandArgs data={node.data} />
    </WorkflowNodeLayoutEdit>
  );
}
WorkflowNodeEditCommand.type = WORKFLOW_NODE_TYPE.COMMAND;

export default WorkflowNodeEditCommand;
