import { WorkflowNodeCommand } from '#packages/common/interface/workflow-nodes.interface';
import { UiInput, UiList, UiSelect, UiSwitch } from '@repo/ui';
import UiExtensionIcon from '../../ui/UiExtensionIcon';
import { useWorkflowEditorStore } from '/@/stores/workflow-editor.store';
import { ChevronDown } from 'lucide-react';
import WorkflowUiFormExpression from '../ui/WorkflowUiFormExpression';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
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

  return (
    <ul className="space-y-3">
      {data.args.map((arg, index) => {
        let argComponent: React.ReactNode = null;

        switch (arg.type) {
          case 'select':
            argComponent = (
              <div className="flex items-center relative">
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
                <ChevronDown className="h-5 w-5 right-3 top-1/2 -translate-y-1/2 absolute" />
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
            >
              {argComponent}
            </WorkflowUiFormExpression>
          </li>
        );
      })}
    </ul>
  );
}

function WorkflowNodeEditCommand() {
  const node = useWorkflowEditorStore.use.editNode() as WorkflowNodeCommand;
  const { data } = node;

  return (
    <WorkflowNodeLayoutEdit
      node={node}
      icon={
        <UiExtensionIcon
          alt={`${data.title} icon`}
          id={data.extension.id}
          icon={data.icon}
          iconWrapper={(icon) => <UiList.Icon icon={icon} />}
        />
      }
      title={data.title}
      subtitle={data.extension.title}
    >
      <CommandArgs data={data} />
    </WorkflowNodeLayoutEdit>
  );
}

export const nodeType = WORKFLOW_NODE_TYPE.COMMAND;

export default WorkflowNodeEditCommand;
