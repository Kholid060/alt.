import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/workflow.const';
import { NodeHandlerNoOp } from './WorkflowNodeHandler';

export class NodeHandlerDoNothing extends NodeHandlerNoOp<WORKFLOW_NODE_TYPE.DO_NOTHING> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.DO_NOTHING);
  }
}
