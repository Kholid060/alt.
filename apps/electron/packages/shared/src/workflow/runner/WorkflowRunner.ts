import EventEmitter from 'eventemitter3';
import type { WorkflowRunnerRunPayload } from '#packages/common/interface/workflow-runner.interace';
import {
  WORKFLOW_MANUAL_TRIGGER_ID,
  WORKFLOW_NODE_TYPE,
} from '#packages/common/utils/constant/constant';
import type {
  WorkflowEdge,
  WorkflowNodes,
} from '#packages/common/interface/workflow.interface';
import type WorkflowNodeHandler from '../node-handler/WorkflowNodeHandler';
import type { DatabaseWorkflowDetail } from '#packages/main/src/interface/database.interface';
import { WorkflowRunnerNodeError } from './workflow-runner-errors';
import ExtensionCommandRunner from '/@/extension/ExtensionCommandRunner';
import SandboxService from '/@/services/sandbox.service';
import { setProperty } from 'dot-prop';
import { debugLog } from '#packages/common/utils/helper';
import { sleep } from '@repo/shared';

export type NodeHandlersObj = Record<
  WORKFLOW_NODE_TYPE,
  WorkflowNodeHandler<WORKFLOW_NODE_TYPE>
>;

export interface WorkflowRunnerOptions extends WorkflowRunnerRunPayload {
  id: string;
  nodeHandlers: NodeHandlersObj;
}

export interface WorkflowRunnerEvents {
  error: (message: string) => void;
  finish: (reason: WorkflowRunnerFinishReason) => void;
}

export enum WorkflowRunnerState {
  Error = 'error',
  Stop = 'stopped',
  Finish = 'finish',
  Running = 'running',
}

export enum WorkflowRunnerFinishReason {
  Done = 'done',
  Stop = 'stopped',
}

interface NodeConnectionMapItem {
  nodeId: string;
  targetHandle?: string | null;
  sourceHandle?: string | null;
}
interface NodeConnectionMap {
  source: NodeConnectionMapItem[];
  target: NodeConnectionMapItem[];
}

function getNodeConnectionsMap(nodes: WorkflowNodes[], edges: WorkflowEdge[]) {
  const connectionMap: Record<string, NodeConnectionMap> = {};
  const nodePositions = new Map(nodes.map((node) => [node.id, node.position]));

  edges.forEach(({ source, target, sourceHandle, targetHandle }) => {
    if (!nodePositions.has(source) || !nodePositions.has(target)) return;

    if (!connectionMap[source]) {
      connectionMap[source] = {
        source: [],
        target: [],
      };
    }
    if (!connectionMap[target]) {
      connectionMap[target] = {
        source: [],
        target: [],
      };
    }

    connectionMap[target].source.push({
      sourceHandle,
      targetHandle,
      nodeId: source,
    });
    connectionMap[source].target.push({
      targetHandle,
      sourceHandle,
      nodeId: target,
    });
  });

  // sort connection by the node Y position
  const connectionSorter = (
    a: NodeConnectionMapItem,
    z: NodeConnectionMapItem,
  ) => nodePositions.get(a.nodeId)!.y - nodePositions.get(z.nodeId)!.y;
  for (const key in connectionMap) {
    const connection = connectionMap[key];
    connection.source.sort(connectionSorter);
    connection.target.sort(connectionSorter);
  }

  return connectionMap;
}

export interface WorkflowRunnerPrevNodeExecution {
  value: unknown;
  node: WorkflowNodes;
  retryCount?: number;
  isRetrying?: boolean;
}

class WorkflowRunner extends EventEmitter<WorkflowRunnerEvents> {
  private startNodeId: string;
  private nodeHandlers: NodeHandlersObj;
  private nodesIdxMap: Map<string, number>;
  private nodeExecutionQueue: string[] = [];

  id: string;
  state: WorkflowRunnerState;
  workflow: DatabaseWorkflowDetail;

  connectionsMap: Record<string, NodeConnectionMap> = {};

  commandRunnerIds: string[];

  constructor({
    id,
    workflow,
    startNodeId,
    nodeHandlers,
  }: WorkflowRunnerOptions) {
    super();

    this.id = id;
    this.startNodeId = startNodeId;
    this.nodeHandlers = nodeHandlers;
    this.state = WorkflowRunnerState.Running;

    this.workflow = workflow;
    this.nodesIdxMap = new Map(
      workflow.nodes.map((node, index) => [node.id, index]),
    );

    this.commandRunnerIds = [];
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
      this.emitError("Couldn't find the starting node");
      return;
    }

    this.connectionsMap = getNodeConnectionsMap(
      this.workflow.nodes,
      this.workflow.edges,
    );

    this.executeNode(startNode);
  }

  stop() {
    this.emit('finish', WorkflowRunnerFinishReason.Stop);
    this.destroy();
  }

  private emitError(message: string) {
    this.emit('error', message);
    this.destroy();
  }

  private getNode(nodeId: string): WorkflowNodes | null {
    if (!this.nodesIdxMap.has(nodeId)) return null;

    const nodeIndex = this.nodesIdxMap.get(nodeId)!;

    return this.workflow.nodes[nodeIndex] ?? null;
  }

  private async evaluateNodeExpression(node: WorkflowNodes) {
    if (!Object.hasOwn(node.data, '$expData')) return node;

    const evaluateExpressions: Record<string, string> = {};
    for (const key in node.data.$expData) {
      const expression = node.data.$expData[key];
      if (!expression.active) continue;

      evaluateExpressions[key] = expression.value;
    }

    const result = await SandboxService.instance.evaluateCode(
      evaluateExpressions,
      {}, // TO_DO: Add context data to expression
    );

    const copyNodeData = structuredClone(node.data);
    for (const key in result) {
      setProperty(copyNodeData, key, result[key]);
    }

    return { ...node, data: copyNodeData } as WorkflowNodes;
  }

  private findNextNode(
    nodeId: string,
    sourceHandle?: string,
  ):
    | {
        node: null;
        status: 'not-found' | 'finish';
      }
    | {
        status: 'continue';
        node: WorkflowNodes;
      } {
    const connection = this.connectionsMap[nodeId];
    if (!connection || connection.target.length === 0) {
      const lastNodeIdQueue = this.nodeExecutionQueue.pop();
      const nextNode = lastNodeIdQueue ? this.getNode(lastNodeIdQueue) : null;

      if (!nextNode) {
        this.state = WorkflowRunnerState.Finish;
        this.emit('finish', WorkflowRunnerFinishReason.Done);
        this.destroy();

        return {
          node: null,
          status: 'finish',
        };
      }

      return {
        node: nextNode,
        status: 'continue',
      };
    }

    const nextNodeId = sourceHandle
      ? connection.target.find((target) =>
          target.sourceHandle?.startsWith(sourceHandle),
        )
      : connection.target[0];
    if (nextNodeId && connection.target.length > 1) {
      this.nodeExecutionQueue.push(
        ...connection.target
          .slice(1)
          .toReversed()
          .map(({ nodeId }) => nodeId),
      );
    }

    const nextNode = nextNodeId ? this.getNode(nextNodeId.nodeId) : null;
    if (!nextNode) {
      this.emitError("Couldn't find the next node");

      return {
        node: null,
        status: 'not-found',
      };
    }

    return {
      node: nextNode,
      status: 'continue',
    };
  }

  private async executeNode(
    node: WorkflowNodes,
    prevExec?: WorkflowRunnerPrevNodeExecution,
  ) {
    try {
      if (node.id === prevExec?.node.id) {
        this.emitError('Stopped to prevent infinite loop');
        return;
      }

      const nodeHandler = this.nodeHandlers[node.type];
      if (!nodeHandler) {
        throw new WorkflowRunnerNodeError(
          `Node with "${node.type}" doesn't have handler`,
        );
      }

      const renderedNode = await this.evaluateNodeExpression(node);
      const result = await nodeHandler.execute({
        runner: this,
        prevExecution: prevExec,
        node: renderedNode,
      });

      const nextNode = this.findNextNode(node.id);
      if (nextNode.status !== 'continue') return;

      this.executeNode(nextNode.node, {
        node,
        value: result.value,
      });
    } catch (error) {
      if (error instanceof WorkflowRunnerNodeError) {
        this.emitError(error.message);
        return;
      }

      if (!node.data.$errorHandler) {
        this.emitError((<Error>error).message);
        return;
      }

      const { action, retry, retryCount, retryIntervalMs } =
        node.data.$errorHandler;

      const retryExecution =
        retry &&
        (prevExec?.isRetrying && typeof prevExec?.retryCount === 'number'
          ? prevExec.retryCount <= retryCount
          : true);
      if (retryExecution) {
        debugLog(
          `Retry execution {${prevExec?.retryCount ?? 0} => ${retryCount}}`,
        );

        await sleep(retryIntervalMs);

        this.executeNode(node, {
          ...(prevExec || { value: null, node }),
          isRetrying: true,
          retryCount: (prevExec?.retryCount ?? 0) + 1,
        });
        return;
      }

      if (action === 'continue' || action === 'fallback') {
        const nextNode = this.findNextNode(
          node.id,
          action === 'fallback' ? 'error-fallback' : '',
        );
        if (nextNode.status !== 'continue') return;

        this.executeNode(
          nextNode.node,
          prevExec ? { node: prevExec.node, value: prevExec.value } : undefined,
        );
        return;
      }

      this.emitError((<Error>error).message);
    }
  }

  private destroy() {
    this.nodesIdxMap.clear();
    this.removeAllListeners();

    this.commandRunnerIds.forEach((id) => {
      ExtensionCommandRunner.instance.stop(id);
    });
    Object.values(this.nodeHandlers).forEach((nodeHandler) => {
      nodeHandler.destroy();
    });
  }
}

export default WorkflowRunner;
