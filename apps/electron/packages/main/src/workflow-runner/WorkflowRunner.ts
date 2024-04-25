import { nanoid } from 'nanoid';
import EventEmitter from 'eventemitter3';
import type { DatabaseWorkflowDetail } from '/@/interface/database.interface';
import type { WorkflowRunnerRunPayload } from '#packages/common/interface/workflow-runner.interace';
import type { Node } from 'reactflow';
import { getOutgoers } from 'reactflow';
import {
  WORKFLOW_MANUAL_TRIGGER_ID,
  WORKFLOW_NODE_TYPE,
} from '#packages/common/utils/constant/constant';

export interface WorkflowRunnerOptions extends WorkflowRunnerRunPayload {}

export interface WorkflowRunnerEvents {
  error: (message: string) => void;
}

export enum WorkflowRunnerState {
  Done = 'done',
  Error = 'error',
  Stop = 'stopped',
  Running = 'running',
}

class WorkflowRunner extends EventEmitter<WorkflowRunnerEvents> {
  private startNodeId: string;
  private workflow: DatabaseWorkflowDetail;

  id: string;
  state: WorkflowRunnerState;

  constructor({ startNodeId, workflow }: WorkflowRunnerOptions) {
    super();

    this.workflow = workflow;
    this.startNodeId = startNodeId;

    this.id = nanoid();
    this.state = WorkflowRunnerState.Running;

    this.start();
  }

  start() {
    const startNode = this.workflow.nodes.find((node) => {
      if (this.startNodeId === WORKFLOW_MANUAL_TRIGGER_ID) {
        return (
          node.type === WORKFLOW_NODE_TYPE.TRIGGER &&
          node.data.type === 'manual'
        );
      }

      return node.id === this.startNodeId;
    });
    if (!startNode) {
      this.state = WorkflowRunnerState.Error;
      this.emit('error', "Couldn't find the starting node");
      return;
    }

    console.log({
      startNode,
      outers: getOutgoers(
        startNode as Node,
        this.workflow.nodes as Node[],
        this.workflow.edges,
      ),
    });
  }
}

export default WorkflowRunner;
