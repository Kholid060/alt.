import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/workflow.const';
import { isObject } from '@repo/shared';
import type {
  WorkflowNodeHandlerExecute,
  WorkflowNodeHandlerExecuteReturn,
} from './WorkflowNodeHandler';
import WorkflowNodeHandler from './WorkflowNodeHandler';
import { getExactType } from '/@/utils/helper';

type ExecParams = WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.LOOP>;

export class NodeHandlerLoop extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.LOOP> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.LOOP);
  }

  private async getLoopData({ node, runner, prevExecution }: ExecParams) {
    let data: unknown = null;

    switch (node.data.dataSource) {
      case 'expression':
        data = await runner.sandbox.evaluateExpression(node.data.expression);
        break;
      case 'prev-node':
        data = prevExecution?.value;
        break;
      case 'variable': {
        if (!runner.dataStorage.variables.has(node.data.varName)) {
          throw new Error(`Couldn't find "${node.data.varName}" variable`);
        }

        data = runner.dataStorage.variables.get(node.data.varName);
        break;
      }
    }

    if (!isObject(data) && !Array.isArray(data)) {
      throw new Error(
        `Can't iterate the data from the data source. Expected "Object" or "Array" but got "${getExactType(data)}"`,
      );
    }

    return data;
  }

  async execute({
    node,
    runner,
    prevExecution,
  }: ExecParams): Promise<WorkflowNodeHandlerExecuteReturn> {
    if (!runner.dataStorage.loopData.has(node.id)) {
      const data = await this.getLoopData({ node, runner, prevExecution });
      const dataArr = Array.isArray(data) ? data : Object.values(data);

      runner.dataStorage.loopData.set(node.id, {
        index: 0,
        data: dataArr,
      });

      return {
        nextNodeHandle: 'start-loop',
        value: { index: 0, value: dataArr[0] },
      };
    }

    const { data, index } = runner.dataStorage.loopData.get(node.id)!;
    const nextIndex = index + 1;

    if (nextIndex > data.length - 1) {
      runner.dataStorage.loopData.delete(node.id);

      return {
        value: { index, value: data.at(-1) },
      };
    }

    runner.dataStorage.loopData.set(node.id, {
      data,
      index: nextIndex,
    });

    return {
      value: {
        index: nextIndex,
        value: data[nextIndex],
      },
      nextNodeHandle: 'start-loop',
    };
  }

  destroy(): void {}
}

export class NodeHandlerBreakLoop extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.BREAK_LOOP> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.BREAK_LOOP, {
      dataValidation: [
        { key: 'loopNodeId', name: 'Loop node id', types: ['String'] },
      ],
    });
  }

  async execute({
    node,
    runner,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.BREAK_LOOP>): Promise<WorkflowNodeHandlerExecuteReturn> {
    runner.dataStorage.loopData.delete(node.data.loopNodeId);

    return {
      value: null,
    };
  }

  destroy() {}
}
