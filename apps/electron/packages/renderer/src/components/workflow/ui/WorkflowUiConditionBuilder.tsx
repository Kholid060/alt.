import {
  WorkflowNodeConditionItem,
  WorkflowNodeConditionItemOperator,
  WorkflowNodeConditionItems,
} from '#packages/common/interface/workflow-nodes.interface';
import { UiButton, UiLabel, UiSelect, UiSwitch, UiTooltip } from '@repo/ui';
import {
  BracesIcon,
  BracketsIcon,
  CaseSensitiveIcon,
  HashIcon,
  InfoIcon,
  PlusIcon,
  ToggleRightIcon,
  TrashIcon,
} from 'lucide-react';
import { nanoid } from 'nanoid/non-secure';
import WorkflowUiFormExpression from './WorkflowUiFormExpression';

const conditionOperators: {
  groupName: string;
  items: { name: string; id: WorkflowNodeConditionItemOperator }[];
}[] = [
  {
    groupName: 'String',
    items: [
      { id: 'str:equal', name: 'Equals' },
      { id: 'str:contains', name: 'contains' },
      { id: 'str:starts-with', name: 'Starts with' },
      { id: 'str:ends-with', name: 'Ends with' },
      { id: 'str:match-regex', name: 'Match RegEx' },
    ],
  },
  {
    groupName: 'Number',
    items: [
      { id: 'int:equal', name: 'Equals' },
      { id: 'int:greater', name: 'Greater than' },
      { id: 'int:less', name: 'Less than' },
      { id: 'int:greater-equal', name: 'Greater than or equals' },
      { id: 'int:less-equal', name: 'Less than or equals' },
    ],
  },
  {
    groupName: 'Object',
    items: [
      { id: 'obj:is-empty', name: 'Is empty' },
      { id: 'obj:has-property', name: 'Has property' },
    ],
  },
  {
    groupName: 'Array',
    items: [
      { id: 'array:contains', name: 'Contains' },
      { id: 'array:len-equal', name: 'Length equals' },
      { id: 'array:len-greater', name: 'Length greater than' },
      { id: 'array:len-less-equal', name: 'Length less than or equal' },
      { id: 'array:len-greater-equal', name: 'Length greater than or equal' },
    ],
  },
  {
    groupName: 'Boolean',
    items: [
      { id: 'bool:equal', name: 'Equals' },
      { id: 'bool:is-true', name: 'Is true' },
      { id: 'bool:is-false', name: 'Is false' },
    ],
  },
  {
    groupName: 'Others',
    items: [{ id: 'any:is-nullish', name: 'Is nullish' }],
  },
];

type OperatorComponent = React.FC<{
  item: WorkflowNodeConditionItem;
  onChange: (data: Partial<Omit<WorkflowNodeConditionItem, 'id'>>) => void;
}>;

const StringOperatorComponent: OperatorComponent = ({ item, onChange }) => {
  return (
    <WorkflowUiFormExpression
      path="value2"
      data={item.$expData}
      className="relative [&_.expression-input-icon]:rounded-tl-none"
      inputClass="border-0 rounded-t-none"
      labelClass="absolute -bottom-0.5 translate-y-full w-full"
      onDataChange={($expData) => onChange({ $expData })}
    >
      <input
        value={`${item.value2}`}
        placeholder="value 2"
        className="h-10 px-3 rounded-b-md w-full bg-transparent focus-visible:outline focus-visible:outline-primary"
        onChange={({ target }) => onChange({ value2: target.value })}
      />
    </WorkflowUiFormExpression>
  );
};

const NumberOperatorComponent: OperatorComponent = ({ item, onChange }) => {
  return (
    <WorkflowUiFormExpression
      path="value2"
      data={item.$expData}
      className="relative [&_.expression-input-icon]:rounded-tl-none"
      inputClass="border-0 rounded-t-none"
      labelClass="absolute -bottom-0.5 translate-y-full w-full"
      onDataChange={($expData) => onChange({ $expData })}
    >
      <input
        value={`${item.value2}`}
        type="number"
        placeholder="value 2"
        className="h-10 px-3 rounded-b-md w-full bg-transparent focus-visible:outline focus-visible:outline-primary"
        onChange={({ target }) => onChange({ value2: target.valueAsNumber })}
      />
    </WorkflowUiFormExpression>
  );
};

const ObjectOperatorComponent: OperatorComponent = ({ item, onChange }) => {
  if (item.operator === 'obj:is-empty') return null;

  return (
    <WorkflowUiFormExpression
      path="value2"
      data={item.$expData}
      className="relative [&_.expression-input-icon]:rounded-tl-none"
      inputClass="border-0 rounded-t-none"
      labelClass="absolute -bottom-0.5 translate-y-full w-full"
      onDataChange={($expData) => onChange({ $expData })}
    >
      <input
        value={`${item.value2}`}
        placeholder="value 2"
        className="h-10 px-3 rounded-b-md w-full bg-transparent focus-visible:outline focus-visible:outline-primary"
        onChange={({ target }) => onChange({ value2: target.value })}
      />
    </WorkflowUiFormExpression>
  );
};

const BoolOperatorComponent: OperatorComponent = ({ item, onChange }) => {
  if (item.operator !== 'bool:equal') return null;

  return (
    <UiSelect.Native
      value={`${item.value2}`}
      placeholder="value 2"
      className="rounded-t-none border-0"
      onChange={({ target }) =>
        onChange({ value2: target.value === 'true' ? true : false })
      }
    >
      <option value="true">True</option>
      <option value="false">False</option>
    </UiSelect.Native>
  );
};

const ArrayOperatorComponent: OperatorComponent = ({ item, onChange }) => {
  return (
    <WorkflowUiFormExpression
      path="value2"
      data={item.$expData}
      className="relative [&_.expression-input-icon]:rounded-tl-none"
      inputClass="border-0 rounded-t-none"
      labelClass="absolute -bottom-0.5 translate-y-full w-full"
      onDataChange={($expData) => onChange({ $expData })}
    >
      <input
        value={`${item.value2}`}
        placeholder="value 2"
        type={item.operator === 'array:contains' ? 'text' : 'number'}
        className="h-10 px-3 rounded-b-md w-full bg-transparent focus-visible:outline focus-visible:outline-primary"
        onChange={({ target }) =>
          onChange({
            value2:
              item.operator === 'array:contains'
                ? target.value
                : target.valueAsNumber,
          })
        }
      />
    </WorkflowUiFormExpression>
  );
};

const components = {
  int: {
    value: NumberOperatorComponent,
    icon: <HashIcon className="h-4 w-4" />,
  },
  obj: {
    value: ObjectOperatorComponent,
    icon: <BracesIcon className="h-4 w-4" />,
  },
  array: {
    value: ArrayOperatorComponent,
    icon: <BracketsIcon className="h-4 w-4" />,
  },
  bool: {
    value: BoolOperatorComponent,
    icon: <ToggleRightIcon className="h-4 w-4" />,
  },
  str: {
    value: StringOperatorComponent,
    icon: <CaseSensitiveIcon className="h-6 w-6" />,
  },
};
const operatorComponents: Partial<
  Record<
    WorkflowNodeConditionItemOperator,
    { value: OperatorComponent; icon: React.ReactNode }
  >
> = {
  'array:contains': components.array,
  'array:len-less': components.array,
  'array:len-equal': components.array,
  'array:len-greater': components.array,
  'array:len-less-equal': components.array,
  'array:len-greater-equal': components.array,
  'bool:equal': components.bool,
  'bool:is-true': components.bool,
  'bool:is-false': components.bool,
  'int:equal': components.int,
  'int:greater': components.int,
  'int:greater-equal': components.int,
  'int:less': components.int,
  'int:less-equal': components.int,
  'obj:has-property': components.obj,
  'obj:is-empty': components.obj,
  'str:contains': components.str,
  'str:ends-with': components.str,
  'str:equal': components.str,
  'str:match-regex': components.str,
  'str:starts-with': components.str,
};

const SecondValueComponent: OperatorComponent = ({ item, ...props }) => {
  const Component = operatorComponents[item.operator]?.value;
  if (!Component) return null;

  return <Component item={item} {...props} />;
};

function OperatorSelect({
  onChange,
  operator,
}: {
  operator: WorkflowNodeConditionItemOperator;
  onChange: (value: WorkflowNodeConditionItemOperator) => void;
}) {
  const icon = operatorComponents[operator]?.icon ?? null;

  return (
    <UiSelect.Native
      value={operator}
      className="w-auto border-0 py-px rounded-none"
      prefixIcon={
        icon ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2">
            {icon}
          </span>
        ) : null
      }
      onChange={({ target }) =>
        onChange(target.value as WorkflowNodeConditionItemOperator)
      }
    >
      {conditionOperators.map((group) => (
        <optgroup label={group.groupName} key={group.groupName}>
          {group.items.map((item) => (
            <option key={group.groupName + item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </optgroup>
      ))}
    </UiSelect.Native>
  );
}

interface WorkflowConditionBuilderProps {
  items: WorkflowNodeConditionItems;
  onItemsChange?: (items: WorkflowNodeConditionItems) => void;
}

function WorkflowUiConditionBuilder({
  items,
  onItemsChange,
}: WorkflowConditionBuilderProps) {
  function addItem(type: WorkflowNodeConditionItem['type'], index?: number) {
    const item: WorkflowNodeConditionItem = {
      type,
      value1: '',
      value2: '',
      id: nanoid(5),
      reverseValue: false,
      operator: 'str:equal',
    };
    if (typeof index === 'number') {
      const itemsAtIndex = items[index] ?? [];
      onItemsChange?.(items.toSpliced(index, 1, [...itemsAtIndex, item]));
      return;
    }

    onItemsChange?.([...items, [item]]);
  }
  function updateItem(
    index: number,
    id: string,
    data: Partial<Omit<WorkflowNodeConditionItem, 'id'>>,
  ) {
    const newItems = [...items];
    newItems[index] = newItems[index].map((item) => {
      if (item.id !== id) return item;

      return { ...item, ...data };
    });

    onItemsChange?.(newItems);
  }
  function deleteItem(index: number, id: string) {
    const newItems = [...items];
    newItems[index] = newItems[index].filter((item) => item.id !== id);

    if (newItems[index].length === 0) newItems.splice(index, 1);

    onItemsChange?.(newItems);
  }

  return (
    <>
      <div className="space-y-2 pt-4">
        {items.map((conditions, index) => (
          <section key={index} className="flex flex-wrap">
            {conditions.length > 1 && (
              <div className="relative w-8">
                <div className="h-full absolute top-0 left-0 rounded-l-md border-primary -z-10 border border-r-0 w-10"></div>
                <span className="absolute top-1/2 -translate-y-1/2 -left-1/2 px-1 py-0.5 text-sm rounded-sm bg-primary">
                  AND
                </span>
              </div>
            )}
            <ul className="space-y-9 flex-1">
              {conditions.map((item) => (
                <li
                  key={item.id}
                  className="rounded-md border text-sm divide-y group/condition"
                >
                  <WorkflowUiFormExpression
                    path="value1"
                    data={item.$expData}
                    className="relative [&_.expression-input-icon]:rounded-b-none"
                    inputClass="border-0 rounded-b-none"
                    labelClass="absolute w-full top-0 -translate-y-full"
                    onDataChange={($expData) =>
                      updateItem(index, item.id, { $expData })
                    }
                  >
                    <div className="flex items-center h-10">
                      <input
                        value={item.value1}
                        placeholder="value 1"
                        onChange={({ target }) =>
                          updateItem(index, item.id, { value1: target.value })
                        }
                        className="px-3 flex-1 h-full rounded-t-md bg-transparent focus-visible:outline focus-visible:outline-primary"
                      />
                    </div>
                  </WorkflowUiFormExpression>
                  <div className="flex items-center h-10">
                    <OperatorSelect
                      operator={item.operator}
                      onChange={(value) =>
                        updateItem(index, item.id, { operator: value })
                      }
                    />
                    <span className="flex items-center flex-grow gap-2 px-3 h-full border-l">
                      <UiSwitch
                        size="sm"
                        checked={item.reverseValue}
                        id={`operator-reverse-${item.id}`}
                        className="align-middle"
                        onCheckedChange={(checked) => {
                          updateItem(index, item.id, { reverseValue: checked });
                        }}
                      />
                      <UiLabel htmlFor={`operator-reverse-${item.id}`}>
                        NOT operator
                      </UiLabel>
                      <UiTooltip
                        label={
                          <>
                            Convert the operator into NOT operator.
                            <br />
                            {
                              'E.g. the "equal" operator will become "not equal"'
                            }
                          </>
                        }
                      >
                        <InfoIcon className="h-4 w-4 text-muted-foreground invisible group-hover/condition:visible" />
                      </UiTooltip>
                    </span>
                    <UiButton
                      variant="ghost"
                      className="rounded-none invisible group-hover/condition:visible"
                      size="icon"
                      onClick={() => deleteItem(index, item.id)}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </UiButton>
                  </div>
                  <SecondValueComponent
                    onChange={(value) => updateItem(index, item.id, value)}
                    item={item}
                  />
                </li>
              ))}
            </ul>
            <div className="w-full">
              {index !== items.length - 1 && (
                <>
                  <UiButton
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    onClick={() => addItem('and', index)}
                  >
                    <PlusIcon className="h-5 w-5 mr-1 -ml-1" />
                    <span>AND</span>
                  </UiButton>
                  <div className="h-8 relative w-full">
                    <span className="bg-teal-500 px-1 py-0 rounded-sm min-w-9 top-1/2 -translate-y-1/2 z-10 left-1/2 -translate-x-1/2 absolute text-center">
                      OR
                    </span>
                    <span className="absolute h-px w-full bg-teal-500 left-0 top-1/2 -translate-y-1/2"></span>
                  </div>
                </>
              )}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-2 space-x-2">
        <UiButton
          size="sm"
          variant="secondary"
          onClick={() => addItem('and', items.length - 1)}
        >
          <PlusIcon className="h-5 w-5 mr-1 -ml-1" />
          <span>AND</span>
        </UiButton>
        <UiButton size="sm" variant="secondary" onClick={() => addItem('or')}>
          <PlusIcon className="h-5 w-5 mr-1 -ml-1" />
          <span>OR</span>
        </UiButton>
      </div>
    </>
  );
}

export default WorkflowUiConditionBuilder;