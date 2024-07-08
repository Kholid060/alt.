import {
  WorkflowNodeExpressionData,
  WorkflowNodeExpressionRecords,
} from '@altdot/workflow';
import {
  FunctionSquareIcon,
  InfoIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from 'lucide-react';
import clsx from 'clsx';
import { UiLabel, UiTooltip, cn } from '@altdot/ui';

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
        'flex rounded-md border focus-within:ring-2 focus-within:ring-primary',
        className,
      )}
    >
      <div className="expression-input-icon w-8 rounded-l-md border-r bg-card pt-2 text-center">
        <FunctionSquareIcon className="inline-block h-5 w-5 text-muted-foreground" />
      </div>
      <textarea
        rows={1}
        id={labelId}
        value={value}
        placeholder="Expression here"
        onChange={({ target }) => onValueChange?.(target.value)}
        className="h-full min-h-9 flex-grow rounded-r-md p-2 focus:outline-none"
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
        'mb-0.5 flex items-center justify-between',
        position === 'top' ? 'mb-0.5' : 'mt-0.5',
        className,
      )}
    >
      <div className="line-clamp-1 flex-grow">
        {label && (
          <UiLabel htmlFor={labelId} className="ml-1 line-clamp-1 inline">
            {label}
          </UiLabel>
        )}
        {description && (
          <UiTooltip label={description} className="max-w-xs">
            <InfoIcon className="invisible ml-1 inline-block h-4 w-4 align-sub text-muted-foreground group-hover/expression:visible" />
          </UiTooltip>
        )}
        {children}
      </div>
      <button
        className={clsx(
          'invisible inline-flex h-5 items-center justify-center rounded px-1.5 text-xs leading-none hover:bg-secondary group-focus-within/expression:visible group-hover/expression:visible',
          !isActive && 'text-muted-foreground',
        )}
        onClick={() => onToggleExpression?.(!data[path]?.active)}
      >
        {
          <SwitchIcon
            className={clsx(
              'mr-1 h-4 w-4',
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
