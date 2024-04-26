import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
import type { WorkflowNodeHandler } from './WorkflowNodeHandler';

export const NodeHandlerCommand: WorkflowNodeHandler<WORKFLOW_NODE_TYPE.COMMAND> =
  function () {
    // do nothing

    return { value: null };
  };
NodeHandlerCommand.type = WORKFLOW_NODE_TYPE.COMMAND;

export const NodeHandlerTrigger: WorkflowNodeHandler<WORKFLOW_NODE_TYPE.TRIGGER> =
  function () {
    // run extension command

    return { value: null };
  };
NodeHandlerTrigger.type = WORKFLOW_NODE_TYPE.TRIGGER;
