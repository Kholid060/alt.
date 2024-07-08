import {
  WorkflowNodeConditionItems,
  WorkflowNodeConditionItem,
} from '@altdot/workflow';
import { isValidType } from '/@/utils/helper';

interface TestConditionsOptions {
  name?: string;
  conditions: WorkflowNodeConditionItems;
  evaluateExpression: (exp: string) => Promise<unknown>;
}

type GetConditionValue = <T = unknown>(
  key: 'value1' | 'value2',
  condition: WorkflowNodeConditionItem,
) => Promise<T>;

async function checkCondition(
  condition: WorkflowNodeConditionItem,
  {
    index,
    getValue,
    pathName,
  }: { getValue: GetConditionValue; pathName: string; index: number },
): Promise<boolean> {
  const value1 = await getValue('value1', condition);
  const getErrorName = (val: 'Value 1' | 'Value 2') =>
    `The value of "${val}" in "${pathName}" at index ${index}`;

  const { operator } = condition;

  if (operator.startsWith('any')) {
    return value1 !== null || value1 !== undefined;
  }

  if (operator.startsWith('array')) {
    isValidType(value1, ['Array'], {
      throw: true,
      errorName: getErrorName('Value 1'),
    });

    const value2 = await getValue<number>('value2', condition);
    const value1Len = (<unknown[]>value1).length;

    switch (operator) {
      case 'array:contains':
        return (<unknown[]>value1).includes(value2);
      case 'array:len-equal':
        return value1Len === value2;
      case 'array:len-greater':
        return value1Len > value2;
      case 'array:len-greater-equal':
        return value1Len >= value2;
      case 'array:len-less':
        return value1Len < value2;
      case 'array:len-less-equal':
        return value1Len <= value2;
      default:
        return false;
    }
  }

  if (operator.startsWith('bool')) {
    isValidType(value1, ['Boolean'], {
      throw: true,
      errorName: getErrorName('Value 1'),
    });

    switch (operator) {
      case 'bool:equal': {
        return value1 === condition.value2;
      }
      case 'bool:is-true':
        return value1 === true;
      case 'bool:is-false':
        return value1 === false;
      default:
        return false;
    }
  }

  if (operator.startsWith('int')) {
    isValidType(value1, ['Number'], {
      throw: true,
      errorName: getErrorName('Value 1'),
    });

    const value2 = await getValue<number>('value2', condition);
    isValidType(value2, ['Number'], {
      throw: true,
      errorName: getErrorName('Value 2'),
    });

    switch (operator) {
      case 'int:equal':
        return value1 === value2;
      case 'int:greater':
        return <number>value1 > value2;
      case 'int:greater-equal':
        return <number>value1 >= value2;
      case 'int:less':
        return <number>value1 < value2;
      case 'int:less-equal':
        return <number>value1 <= value2;
      default:
        return false;
    }
  }

  if (operator.startsWith('str')) {
    const value2 = await getValue<string>('value2', condition);
    if (operator === 'str:match-regex') {
      isValidType(value1, ['String', 'RegExp'], {
        throw: true,
        errorName: getErrorName('Value 1'),
      });

      const regex =
        value1 instanceof RegExp ? value1 : new RegExp(value1 as string);

      return regex.test(value2);
    }

    isValidType(value1, ['String'], {
      throw: true,
      errorName: getErrorName('Value 1'),
    });

    switch (operator) {
      case 'str:contains':
        return (<string>value1).includes(value2);
      case 'str:ends-with':
        return (<string>value1).endsWith(value2);
      case 'str:equal':
        return <string>value1 === value2;
      case 'str:starts-with':
        return (<string>value1).startsWith(value2);
      default:
        return false;
    }
  }

  if (operator.startsWith('obj')) {
    isValidType(value1, ['Object'], {
      throw: true,
      errorName: getErrorName('Value 1'),
    });

    const value2 = await getValue<string>('value2', condition);

    switch (operator) {
      case 'obj:has-property':
        return Object.hasOwn(value1 as object, value2 as string);
      case 'obj:is-empty':
        return Object.keys(value1 as object).length === 0;
      default:
        return false;
    }
  }

  return false;
}

export async function testNodeConditions({
  conditions,
  name = 'Condition',
  evaluateExpression,
}: TestConditionsOptions) {
  // @ts-expect-error....
  const getValue: GetConditionValue = (key, condition) => {
    const expression = condition.$expData?.[key];
    if (expression?.active) {
      return evaluateExpression(expression.value);
    }

    return Promise.resolve(condition[key]);
  };

  for (const orConditions of conditions) {
    let isMatch = false;

    for (let index = 0; index < orConditions.length; index += 1) {
      const condition = orConditions[index];

      isMatch = await checkCondition(condition, {
        getValue,
        pathName: name,
        index,
      });
      isMatch = condition.reverseValue ? !isMatch : isMatch;

      if (!isMatch) break;
    }

    if (isMatch) return true;
  }

  return false;
}
