import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/workflow.const';
import { NodeHandlerNoOp } from './WorkflowNodeHandler';

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

export class NodeHandlerTriggerExecuteWorkflow extends NodeHandlerNoOp<WORKFLOW_NODE_TYPE.TRIGGER_EXECUTE_WORKFLOW> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.TRIGGER_EXECUTE_WORKFLOW);
  }
}
