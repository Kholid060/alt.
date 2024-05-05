import {
  WorkflowNodeExpressionData,
  WorkflowNodeExpressionRecords,
} from '#packages/common/interface/workflow-nodes.interface';
import {
  FunctionSquareIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from 'lucide-react';
import clsx from 'clsx';
import { useWorkflowEditorStore } from '/@/stores/workflow-editor.store';
import { UiLabel, cn } from '@repo/ui';

export function WorkflowUiExpressionInput({
  value,
  labelId,
  className,
  onValueChange,
}: {
  value?: string;
  labelId?: string;
  className?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <div
      className={cn(
        'flex border rounded-md focus-within:ring-2 focus-within:ring-primary',
        className,
      )}
    >
      <div className="bg-card border-r rounded-l-md pt-2 w-8 text-center">
        <FunctionSquareIcon className="h-5 w-5 text-muted-foreground inline-block" />
      </div>
      <textarea
        rows={1}
        id={labelId}
        value={value}
        placeholder="Expression here"
        onChange={({ target }) => onValueChange?.(target.value)}
        className="flex-grow h-full min-h-9 p-2 rounded-r-md focus:outline-none"
      ></textarea>
    </div>
  );
}

interface WorkflowFormExpressionProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  path: string;
  label?: string;
  labelId?: string;
  noToggle?: boolean;
  children?: React.ReactNode;
  data?: WorkflowNodeExpressionRecords;
}

function WorkflowUiFormExpression({
  path,
  label,
  labelId,
  noToggle,
  children,
  data = {},
  className,
  ...props
}: WorkflowFormExpressionProps) {
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  const isActive = noToggle ?? Boolean(data[path]?.active);
  const SwitchIcon = isActive ? ToggleRightIcon : ToggleLeftIcon;

  function updateExpressionData(value: Partial<WorkflowNodeExpressionData>) {
    const expData: WorkflowNodeExpressionData = data[path]
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
            <UiLabel htmlFor={labelId} className="ml-1 line-clamp-1">
              {label}
            </UiLabel>
          )}
        </div>
        {!noToggle && (
          <button
            className={clsx(
              'group-hover/expression:visible group-focus-within/expression:visible invisible h-5 hover:bg-secondary leading-none px-1.5 rounded text-xs inline-flex items-center justify-center',
              !isActive && 'text-muted-foreground',
            )}
            onClick={() =>
              updateExpressionData({ active: !data[path]?.active })
            }
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
        )}
      </div>
      {isActive ? (
        <WorkflowUiExpressionInput
          labelId={labelId}
          value={data[path]?.value ?? ''}
          onValueChange={(value) => updateExpressionData({ value: value })}
        />
      ) : (
        children
      )}
    </div>
  );
}

export default WorkflowUiFormExpression;
