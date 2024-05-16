import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/workflow.const';
import type { WorkflowNodeHandlerExecuteReturn } from './WorkflowNodeHandler';
import WorkflowNodeHandler from './WorkflowNodeHandler';

class NodeHandlerNoOp<
  T extends WORKFLOW_NODE_TYPE,
> extends WorkflowNodeHandler<T> {
  constructor(type: T) {
    super(type);
  }

  execute(): WorkflowNodeHandlerExecuteReturn {
    // do nothing
    return { value: null };
  }

  destroy(): void {
    // do nothing
  }
}

export class NodeHandlerTrigger extends NodeHandlerNoOp<WORKFLOW_NODE_TYPE.TRIGGER> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.TRIGGER);
  }
}

export class NodeHandlerTriggerShortcut extends NodeHandlerNoOp<WORKFLOW_NODE_TYPE.TRIGGER_SHORTCUT> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.TRIGGER_SHORTCUT);
  }
}

export class NodeHandlerDoNothing extends NodeHandlerNoOp<WORKFLOW_NODE_TYPE.DO_NOTHING> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.DO_NOTHING);
  }
}
