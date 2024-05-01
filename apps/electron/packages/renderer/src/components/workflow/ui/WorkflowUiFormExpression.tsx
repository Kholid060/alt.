import { WorkflowFormExpressionData } from '#packages/common/interface/workflow.interface';
import { ToggleLeftIcon, ToggleRightIcon } from 'lucide-react';
import clsx from 'clsx';

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
  const isActive = Boolean(data[path]?.active);
  const SwitchIcon = isActive ? ToggleRightIcon : ToggleLeftIcon;

  return (
    <div className={clsx('group/expression', className)} {...props}>
      <div className="flex items-center justify-between mb-0.5">
        {label && (
          <label
            htmlFor={labelId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ml-1 line-clamp-1"
          >
            {label}
          </label>
        )}
        <button
          className={clsx(
            'group-hover/expression:visible invisible h-5 hover:bg-secondary leading-none px-1.5 rounded text-xs inline-flex items-center justify-center',
            !isActive && 'text-muted-foreground',
          )}
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
      {children}
    </div>
  );
}

export default WorkflowUiFormExpression;
