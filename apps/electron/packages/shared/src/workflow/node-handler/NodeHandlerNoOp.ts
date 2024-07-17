import { WORKFLOW_NODE_TYPE } from '@altdot/workflow/dist/const/workflow-nodes-type.const';
import { NodeHandlerNoOp } from './WorkflowNodeHandler';

export class NodeHandlerDoNothing extends NodeHandlerNoOp<WORKFLOW_NODE_TYPE.DO_NOTHING> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.DO_NOTHING);
  }
}
