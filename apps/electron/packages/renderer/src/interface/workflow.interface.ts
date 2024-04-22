import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
import { Node } from 'reactflow';
import { SetOptional } from 'type-fest';

interface WorkflowNodeBaseData {
  description?: string;
}

export type WorkflowNodeCommand = Node<
  {
    icon: string;
    title: string;
    commandId: string;
    extensionId: string;
  } & WorkflowNodeBaseData,
  WORKFLOW_NODE_TYPE.COMMAND
>;

export type WorkflowNodes = WorkflowNodeCommand;

export type WorkflowGetNode<T extends WORKFLOW_NODE_TYPE> = Extract<
  WorkflowNodeCommand,
  { type: T }
>;

export type WorkflowNewNode = SetOptional<WorkflowNodes, 'id'>;
