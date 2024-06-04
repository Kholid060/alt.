import {
  WorkflowNodeExpressionData,
  WorkflowNodeExpressionRecords,
} from '#packages/common/interface/workflow-nodes.interface';
import {
  FunctionSquareIcon,
  InfoIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from 'lucide-react';
import clsx from 'clsx';
import { UiLabel, UiTooltip, cn } from '@repo/ui';

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
      <div className="bg-card border-r rounded-l-md pt-2 w-8 text-center expression-input-icon">
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

function WorkflowUiExpressionLabel({
  data,
  path,
  label,
  labelId,
  children,
  isActive,
  position,
  className,
  description,
  onToggleExpression,
}: {
  path: string;
  label?: string;
  labelId?: string;
  isActive: boolean;
  className?: string;
  description?: string;
  children?: React.ReactNode;
  position: 'bottom' | 'top';
  data: WorkflowNodeExpressionRecords;
  onToggleExpression?(value: boolean): void;
}) {
  const SwitchIcon = isActive ? ToggleRightIcon : ToggleLeftIcon;

  return (
    <div
      className={clsx(
        'flex items-center justify-between mb-0.5',
        position === 'top' ? 'mb-0.5' : 'mt-0.5',
        className,
      )}
    >
      <div className="flex-grow line-clamp-1">
        {label && (
          <UiLabel htmlFor={labelId} className="ml-1 line-clamp-1 inline">
            {label}
          </UiLabel>
        )}
        {description && (
          <UiTooltip label={description} className="max-w-xs">
            <InfoIcon className="h-4 w-4 text-muted-foreground inline-block align-sub ml-1 invisible group-hover/expression:visible" />
          </UiTooltip>
        )}
        {children}
      </div>
      <button
        className={clsx(
          'group-hover/expression:visible group-focus-within/expression:visible invisible h-5 hover:bg-secondary leading-none px-1.5 rounded text-xs inline-flex items-center justify-center',
          !isActive && 'text-muted-foreground',
        )}
        onClick={() => onToggleExpression?.(!data[path]?.active)}
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
  );
}

interface WorkflowFormExpressionProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  path: string;
  label?: string;
  labelId?: string;
  labelClass?: string;
  inputClass?: string;
  description?: string;
  children?: React.ReactNode;
  labelChildren?: React.ReactNode;
  labelPosition?: 'top' | 'bottom';
  data?: WorkflowNodeExpressionRecords;
  onDataChange?: (data: WorkflowNodeExpressionRecords) => void;
}

function WorkflowUiFormExpression({
  path,
  label,
  labelId,
  children,
  data = {},
  className,
  labelClass,
  inputClass,
  description,
  onDataChange,
  labelChildren,
  labelPosition = 'top',
  ...props
}: WorkflowFormExpressionProps) {
  const isActive = Boolean(data[path]?.active);

  function updateExpressionData(value: Partial<WorkflowNodeExpressionData>) {
    const expData: WorkflowNodeExpressionData = data[path]
      ? { ...data[path], ...value }
      : { active: true, value: '', ...value };
    const $expData = {
      ...data,
      [path]: expData,
    };

    onDataChange?.($expData);
  }

  return (
    <div className={clsx('group/expression', className)} {...props}>
      {labelPosition === 'top' && (
        <WorkflowUiExpressionLabel
          data={data}
          path={path}
          label={label}
          labelId={labelId}
          isActive={isActive}
          className={labelClass}
          position={labelPosition}
          description={description}
          onToggleExpression={(value) =>
            updateExpressionData({ active: value })
          }
        >
          {labelChildren}
        </WorkflowUiExpressionLabel>
      )}
      {isActive ? (
        <WorkflowUiExpressionInput
          className={inputClass}
          labelId={labelId}
          value={data[path]?.value ?? ''}
          onValueChange={(value) => updateExpressionData({ value: value })}
        />
      ) : (
        children
      )}
      {labelPosition === 'bottom' && (
        <WorkflowUiExpressionLabel
          data={data}
          path={path}
          label={label}
          labelId={labelId}
          isActive={isActive}
          className={labelClass}
          position={labelPosition}
          description={description}
          onToggleExpression={(value) =>
            updateExpressionData({ active: value })
          }
        >
          {labelChildren}
        </WorkflowUiExpressionLabel>
      )}
    </div>
  );
}

export default WorkflowUiFormExpression;
