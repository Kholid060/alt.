import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
import type { WorkflowNodeHandlerExecuteReturn } from './WorkflowNodeHandler';
import WorkflowNodeHandler from './WorkflowNodeHandler';

export class NodeHandlerTrigger extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.TRIGGER> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.TRIGGER);
  }

  execute(): WorkflowNodeHandlerExecuteReturn {
    // do nothing
    return { value: null };
  }

  destroy(): void {
    // do nothing
  }
}
