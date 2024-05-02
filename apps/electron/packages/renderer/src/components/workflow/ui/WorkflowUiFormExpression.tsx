import {
  WorkflowFormExpression,
  WorkflowFormExpressionData,
} from '#packages/common/interface/workflow.interface';
import {
  FunctionSquareIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from 'lucide-react';
import clsx from 'clsx';
import { useWorkflowEditorStore } from '/@/stores/workflow-editor.store';

interface WorkflowFormExpressionProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  path: string;
  label?: string;
  value: unknown;
  labelId?: string;
  children?: React.ReactNode;
  data: WorkflowFormExpressionData;
}

function WorkflowUiFormExpression({
  data,
  path,
  label,
  value,
  labelId,
  children,
  className,
  ...props
}: WorkflowFormExpressionProps) {
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  const isActive = Boolean(data[path]?.active);
  const SwitchIcon = isActive ? ToggleRightIcon : ToggleLeftIcon;

  function updateExpressionData(value: Partial<WorkflowFormExpression>) {
    const expData: WorkflowFormExpression = data[path]
      ? { ...data[path], ...value }
      : { active: true, value: '', ...value };

    updateEditNode({
      $expData: {
        ...data,
        [path]: expData,
      },
    });
  }

  return (
    <div className={clsx('group/expression', className)} {...props}>
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex-grow">
          {label && (
            <label
              htmlFor={labelId}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ml-1 line-clamp-1"
            >
              {label}
            </label>
          )}
        </div>
        <button
          className={clsx(
            'group-hover/expression:visible group-focus-within/expression:visible invisible h-5 hover:bg-secondary leading-none px-1.5 rounded text-xs inline-flex items-center justify-center',
            !isActive && 'text-muted-foreground',
          )}
          onClick={() => updateExpressionData({ active: !data[path]?.active })}
        >
          {
            <SwitchIcon
              className={clsx(
                'h-4 w-4 mr-1',
                isActive && 'fill-primary stroke-white',
              )}
            />
          }
          Expression
        </button>
      </div>
      {isActive ? (
        <div className="flex border rounded-md focus-within:ring-2 focus-within:ring-primary">
          <div className="bg-card border-r rounded-l-md pt-2 w-8 text-center">
            <FunctionSquareIcon className="h-5 w-5 text-muted-foreground inline-block" />
          </div>
          <textarea
            rows={1}
            placeholder="Expression here"
            value={data[path].value ?? ''}
            onChange={({ target }) =>
              updateExpressionData({ value: target.value })
            }
            className="flex-grow h-full min-h-10 p-2 rounded-r-md focus:outline-none"
          ></textarea>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export default WorkflowUiFormExpression;
