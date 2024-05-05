import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
import type {
  WorkflowNodeHandlerExecute,
  WorkflowNodeHandlerExecuteReturn,
} from './WorkflowNodeHandler';
import WorkflowNodeHandler from './WorkflowNodeHandler';
import { NodeInvalidType } from '/@/utils/custom-errors';
import { getExactType, isValidType, promiseWithSignal } from '/@/utils/helper';

export class NodeHandlerCode extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.CODE> {
  private controller = new AbortController();

  constructor() {
    super(WORKFLOW_NODE_TYPE.CODE);
  }

  async execute({
    node,
    runner,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.CODE>): Promise<WorkflowNodeHandlerExecuteReturn> {
    const code = `(async () => {\n${node.data.jsCode}\n})()`;
    const result = await runner.sandbox.evaluateCode(code, {
      isPromise: true,
      signal: this.controller.signal,
    });

    return {
      value: result,
    };
  }

  destroy() {
    this.controller.abort();
  }
}

export class NodeHandlerDelay extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.DELAY> {
  private controller = new AbortController();
  private timers = new Set<NodeJS.Timeout>();

  constructor() {
    super(WORKFLOW_NODE_TYPE.DELAY);
  }

  async execute({
    node,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.DELAY>): Promise<WorkflowNodeHandlerExecuteReturn> {
    if (!isValidType(node.data.delayMs, ['Number'])) {
      throw new NodeInvalidType(getExactType(node.data.delayMs), ['Number']);
    }

    await promiseWithSignal((resolve) => {
      const timeout = setTimeout(() => {
        this.timers.delete(timeout);
        resolve();
      }, node.data.delayMs);
      this.timers.add(timeout);
    }, this.controller.signal);

    return {
      value: null,
    };
  }

  destroy() {
    this.controller.abort();
    this.timers.forEach((value) => {
      clearTimeout(value);
    });

    this.timers.clear();
  }
}
