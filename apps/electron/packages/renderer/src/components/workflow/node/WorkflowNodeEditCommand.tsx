import { WorkflowNodeCommand } from '#packages/common/interface/workflow.interface';
import {
  UiInput,
  UiList,
  UiSelect,
  UiSwitch,
  UiTabs,
  UiTabsContent,
  UiTabsList,
  UiTabsTrigger,
} from '@repo/ui';
import UiExtensionIcon from '../../ui/UiExtensionIcon';
import { useWorkflowEditorStore } from '/@/stores/workflow-editor.store';
import { ChevronDown } from 'lucide-react';
import WorkflowUiFormExpression from '../ui/WorkflowUiFormExpression';

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
    <ul className="space-y-2">
      {data.args.map((arg) => {
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
              <div className="flex items-center gap-1">
                <UiSwitch
                  id={arg.name}
                  size="sm"
                  checked={Boolean(data.argsValue[arg.name])}
                  onCheckedChange={(checked) => {
                    updateArgValue(arg.name, checked);
                  }}
                  className="data-[state=unchecked]:bg-secondary-selected"
                />
                <span className="line-clamp-1 max-w-28">{arg.placeholder}</span>
              </div>
            );
            break;
        }

        return (
          <li key={data.extension.id + arg.name}>
            <WorkflowUiFormExpression
              label={arg.title || arg.name}
              labelId={arg.name}
              data={data.$expData ?? {}}
              path={`argsValue.${arg.name}`}
              value={data.argsValue[arg.name]}
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
  const { data } = useWorkflowEditorStore.use.editNode() as WorkflowNodeCommand;

  return (
    <>
      <div className="p-4 pb-2 flex items-center gap-2">
        <div className="h-10 w-10">
          <UiExtensionIcon
            alt={`${data.title} icon`}
            id={data.extension.id}
            icon={data.icon}
            iconWrapper={(icon) => <UiList.Icon icon={icon} />}
          />
        </div>
        <div className="flex-grow">
          <p className="leading-tight">{data.title} </p>
          <p className="text-sm text-muted-foreground">
            {data.extension.title}
          </p>
        </div>
      </div>
      <UiTabs variant="line" defaultValue="arguments">
        <UiTabsList>
          <UiTabsTrigger value="arguments">Arguments</UiTabsTrigger>
          <UiTabsTrigger value="settings">Settings</UiTabsTrigger>
        </UiTabsList>
        <UiTabsContent value="arguments" className="p-4 mt-0">
          <CommandArgs data={data} />
        </UiTabsContent>
      </UiTabs>
    </>
  );
}

export default WorkflowNodeEditCommand;
