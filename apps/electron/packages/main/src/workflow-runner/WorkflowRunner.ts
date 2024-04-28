import { nanoid } from 'nanoid';
import EventEmitter from 'eventemitter3';
import type {
  WorkflowRunnerMessagePortAsyncEvents,
  WorkflowRunnerRunPayload,
} from '#packages/common/interface/workflow-runner.interace';
import {
  WORKFLOW_MANUAL_TRIGGER_ID,
  WORKFLOW_NODE_TYPE,
} from '#packages/common/utils/constant/constant';
import type {
  WorkflowEdge,
  WorkflowNodes,
} from '#packages/common/interface/workflow.interface';
import type { WorkflowNodeHandler } from './node-handler/WorkflowNodeHandler';
import type BetterMessagePort from '#packages/common/utils/BetterMessagePort';

type NodeHandlers = Record<
  WORKFLOW_NODE_TYPE,
  WorkflowNodeHandler<WORKFLOW_NODE_TYPE>
>;

export interface WorkflowRunnerOptions extends WorkflowRunnerRunPayload {
  nodeHandlers: NodeHandlers;
  messagePort: BetterMessagePort<WorkflowRunnerMessagePortAsyncEvents>;
}

export interface WorkflowRunnerEvents {
  done: () => void;
  error: (message: string) => void;
}

export enum WorkflowRunnerState {
  Done = 'done',
  Error = 'error',
  Stop = 'stopped',
  Running = 'running',
}

interface NodeConnectionMap {
  source: string[];
  target: string[];
}

function getNodeConnectionsMap(nodes: WorkflowNodes[], edges: WorkflowEdge[]) {
  const connectionMap: Record<string, NodeConnectionMap> = {};
  const nodePositions = new Map(nodes.map((node) => [node.id, node.position]));

  edges.forEach((edge) => {
    if (!nodePositions.has(edge.source) || !nodePositions.has(edge.target))
      return;

    if (!connectionMap[edge.source]) {
      connectionMap[edge.source] = {
        source: [],
        target: [],
      };
    }
    if (!connectionMap[edge.target]) {
      connectionMap[edge.target] = {
        source: [],
        target: [],
      };
    }

    connectionMap[edge.target].source.push(edge.source);
    connectionMap[edge.source].target.push(edge.target);
  });

  // sort connection by the node Y position
  const connectionSorter = (a: string, z: string) =>
    nodePositions.get(a)!.y - nodePositions.get(z)!.y;
  for (const key in connectionMap) {
    const connection = connectionMap[key];
    connection.source.sort(connectionSorter);
    connection.target.sort(connectionSorter);
  }

  return connectionMap;
}

class WorkflowRunner extends EventEmitter<WorkflowRunnerEvents> {
  private startNodeId: string;
  private nodeHandlers: NodeHandlers;
  private nodeExecutionQueue: string[] = [];

  private messagePort: WorkflowRunnerOptions['messagePort'];

  id: string;
  workflowId: string;
  state: WorkflowRunnerState;
  nodes: Map<string, WorkflowNodes>;
  connectionsMap: Record<string, NodeConnectionMap> = {};

  constructor({
    workflow,
    startNodeId,
    messagePort,
    nodeHandlers,
  }: WorkflowRunnerOptions) {
    super();

    this.startNodeId = startNodeId;
    this.nodeHandlers = nodeHandlers;

    this.messagePort = messagePort;

    this.id = nanoid();
    this.workflowId = workflow.id;
    this.state = WorkflowRunnerState.Running;
    this.nodes = new Map(workflow.nodes.map((node) => [node.id, node]));

    this.start(workflow.nodes, workflow.edges);
  }

  private start(nodes: WorkflowNodes[], edges: WorkflowEdge[]) {
    const startNode = nodes.find((node) => {
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

    this.connectionsMap = getNodeConnectionsMap(nodes, edges);

    this.executeNode(startNode);
  }

  private async executeNode(node: WorkflowNodes, previousNode?: WorkflowNodes) {
    const nodeHandler = this.nodeHandlers[node.type];
    if (!nodeHandler) {
      throw new Error(`Node with "${node.type}" doesn't have handler`);
    }

    const result = await nodeHandler.call(this, node);
    console.log(result);

    const connection = this.connectionsMap[result.nextNodeId || node.id];
    if (!connection || connection.target.length === 0) {
      const lastNodeIdQueue = this.nodeExecutionQueue.pop();
      if (!lastNodeIdQueue || !this.nodes.has(lastNodeIdQueue)) {
        this.state = WorkflowRunnerState.Done;
        this.emit('done');
        return;
      }

      const nextNode = this.nodes.get(lastNodeIdQueue)!;
      this.executeNode(nextNode, previousNode);

      return;
    }

    const [nextNodeId, ...queueNodeIds] = connection.target;
    this.nodeExecutionQueue.push(...queueNodeIds.toReversed());

    console.log('Next Node => ', nextNodeId, 'queue => ', queueNodeIds);

    const nextNode = this.nodes.get(nextNodeId);
    if (!nextNode) {
      this.emit('error', `Couldn't find node with "${nextNodeId}" id`);
      return;
    }

    this.executeNode(nextNode);
  }
}

export default WorkflowRunner;
