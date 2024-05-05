import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
import type {
  WorkflowNodeHandlerExecute,
  WorkflowNodeHandlerExecuteReturn,
} from './WorkflowNodeHandler';
import WorkflowNodeHandler from './WorkflowNodeHandler';

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
