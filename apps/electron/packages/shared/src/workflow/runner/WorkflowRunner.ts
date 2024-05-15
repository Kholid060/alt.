import dayjs from 'dayjs';
import EventEmitter from 'eventemitter3';
import type { WorkflowRunnerRunPayload } from '#packages/common/interface/workflow-runner.interace';
import {
  WORKFLOW_MANUAL_TRIGGER_ID,
  WORKFLOW_NODE_TYPE,
} from '#packages/common/utils/constant/constant';
import type { WorkflowEdge } from '#packages/common/interface/workflow.interface';
import type WorkflowNodeHandler from '../node-handler/WorkflowNodeHandler';
import type { DatabaseWorkflowDetail } from '#packages/main/src/interface/database.interface';
import { WorkflowRunnerNodeError } from './workflow-runner-errors';
import { debugLog } from '#packages/common/utils/helper';
import { sleep } from '@repo/shared';
import WorkflowRunnerData from './WorkflowRunnerData';
import type { WorkflowNodes } from '#packages/common/interface/workflow-nodes.interface';
import type { WorkflowNodeHandlerExecuteReturn } from '../node-handler/WorkflowNodeHandler';
import WorkflowRunnerSandbox from './WorkflowRunnerSandbox';
import { clipboard } from 'electron';
import { nanoid } from 'nanoid';
import { validateTypes } from '/@/utils/helper';

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
  Idle = 'idle',
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
  source: Record<string, NodeConnectionMapItem[]>;
  target: Record<string, NodeConnectionMapItem[]>;
}

function extractHandleType(handle: string) {
  const handles = handle.split(':');
  if (handles.length <= 1) return 'default';

  return handles[0];
}
function getNodeConnectionsMap(nodes: WorkflowNodes[], edges: WorkflowEdge[]) {
  const connectionMap: Record<string, NodeConnectionMap> = {};
  const nodePositions = new Map(nodes.map((node) => [node.id, node.position]));

  edges.forEach(({ source, target, sourceHandle, targetHandle }) => {
    if (!nodePositions.has(source) || !nodePositions.has(target)) return;

    if (!connectionMap[source]) {
      connectionMap[source] = {
        source: { default: [] },
        target: { default: [] },
      };
    }
    if (!connectionMap[target]) {
      connectionMap[target] = {
        source: { default: [] },
        target: { default: [] },
      };
    }

    connectionMap[target].source.default.push({
      sourceHandle,
      targetHandle,
      nodeId: source,
    });

    const sourceHandleType = extractHandleType(sourceHandle ?? '');
    if (!connectionMap[source].target[sourceHandleType]) {
      connectionMap[source].target[sourceHandleType] = [];
    }
    connectionMap[source].target[sourceHandleType].push({
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

    for (const handle in connection.source) {
      connection.source[handle].sort(connectionSorter);
    }
    for (const handle in connection.target) {
      connection.target[handle].sort(connectionSorter);
    }
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
  stepCount: number = 0;
  state: WorkflowRunnerState;
  workflow: DatabaseWorkflowDetail;
  connectionsMap: Record<string, NodeConnectionMap> = {};

  sandbox: WorkflowRunnerSandbox;
  dataStorage: WorkflowRunnerData;

  constructor({
    id,
    workflow,
    startNodeId,
    nodeHandlers,
  }: WorkflowRunnerOptions) {
    super();

    this.id = id;
    this.workflow = workflow;
    this.startNodeId = startNodeId;
    this.nodeHandlers = nodeHandlers;
    this.state = WorkflowRunnerState.Idle;

    this.dataStorage = new WorkflowRunnerData();
    this.sandbox = new WorkflowRunnerSandbox(this);

    this.nodesIdxMap = new Map(
      workflow.nodes.map((node, index) => [node.id, index]),
    );
  }

  start() {
    if (this.state !== WorkflowRunnerState.Idle) return;

    const startNode = this.workflow.nodes.find((node) => {
      if (this.startNodeId === WORKFLOW_MANUAL_TRIGGER_ID) {
        return node.type === WORKFLOW_NODE_TYPE.TRIGGER;
      }

      return node.id === this.startNodeId;
    });
    if (!startNode) {
      this.state = WorkflowRunnerState.Error;
      this.emit('error', "Couldn't find the starting node");
      return;
    }

    // Init Connection Map
    this.connectionsMap = getNodeConnectionsMap(
      this.workflow.nodes,
      this.workflow.edges,
    );

    // Store workflow initial variable
    const varExpValue: Record<string, string> = {
      clipboard: clipboard.readText(),
      date: dayjs().format('DD-MM-YYYY'),
      currentTime: dayjs().format('HH:mm:ss'),
    };
    this.workflow.variables.forEach((variable) => {
      const varValue = this.sandbox.mustacheTagRenderer({
        str: variable.value,
        replacer(path, rawPath) {
          if (Object.hasOwn(varExpValue, path)) return varExpValue[path];
          if (path === 'random') return nanoid();

          return rawPath;
        },
      });
      this.dataStorage.variables.set(variable.name, varValue);
    });

    this.state = WorkflowRunnerState.Running;

    this.executeNode(startNode);
  }

  stop() {
    this.state = WorkflowRunnerState.Stop;
    this.emit('finish', WorkflowRunnerFinishReason.Stop);
  }

  private getNode(nodeId: string): WorkflowNodes | null {
    if (!this.nodesIdxMap.has(nodeId)) return null;

    const nodeIndex = this.nodesIdxMap.get(nodeId)!;

    return this.workflow.nodes[nodeIndex] ?? null;
  }

  private async evaluateNodeExpression(node: WorkflowNodes) {
    if (!Object.hasOwn(node.data, '$expData')) return node;

    const nodeData = await this.sandbox.evaluateExpAndApply(
      node.data.$expData!,
      node.data,
    );
    if (!nodeData.isApplied) return node;

    return { ...node, data: nodeData.data } as WorkflowNodes;
  }

  private findNextNode(
    nodeId: string,
    sourceHandle: string = 'default',
  ):
    | {
        node: null;
        status: 'not-found' | 'finish';
      }
    | {
        status: 'continue';
        node: WorkflowNodes;
      } {
    if (!this.nodesIdxMap.has(nodeId)) {
      this.state = WorkflowRunnerState.Error;
      this.emit('error', `Couldn't find node with "${nodeId}" id`);

      return {
        node: null,
        status: 'not-found',
      };
    }

    const connection = this.connectionsMap[nodeId]?.target[sourceHandle];
    if (!connection || connection.length === 0) {
      const lastNodeIdQueue = this.nodeExecutionQueue.pop();
      const nextNode = lastNodeIdQueue ? this.getNode(lastNodeIdQueue) : null;

      if (!nextNode) {
        this.state = WorkflowRunnerState.Finish;
        this.emit('finish', WorkflowRunnerFinishReason.Done);

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
    const nodeConnection = sourceHandle
      ? connection.find((target) =>
          target.sourceHandle?.startsWith(sourceHandle),
        )
      : connection[0];
    if (nodeConnection && connection.length > 1) {
      this.nodeExecutionQueue.push(
        ...connection
          .slice(1)
          .toReversed()
          .map(({ nodeId }) => nodeId),
      );
    }

    const nextNode = nodeConnection && this.getNode(nodeConnection.nodeId);
    if (!nextNode) {
      this.state = WorkflowRunnerState.Error;
      this.emit('error', "Couldn't find the next node");

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
      if (this.state !== WorkflowRunnerState.Running) return;

      if (node.id === prevExec?.node.id) {
        this.state = WorkflowRunnerState.Error;
        this.emit('error', 'Stopped to prevent infinite loop');
        return;
      }

      const nodeHandler = this.nodeHandlers[node.type];
      if (!nodeHandler) {
        throw new WorkflowRunnerNodeError(
          `Node with "${node.type}" doesn't have handler`,
        );
      }

      this.stepCount += 1;

      let execResult: WorkflowNodeHandlerExecuteReturn = {
        value: prevExec?.value,
      };
      if (!node.data.isDisabled) {
        const renderedNode = await this.evaluateNodeExpression(node);

        if (nodeHandler.dataValidation) {
          validateTypes(renderedNode.data, nodeHandler.dataValidation);
        }

        execResult = await nodeHandler.execute({
          runner: this,
          node: renderedNode,
          prevExecution: prevExec,
        });
      }

      this.dataStorage.setPrevNodeData(execResult.value);

      const nextNode = this.findNextNode(
        execResult.nextNodeId ?? node.id,
        execResult.nextNodeHandle,
      );
      if (nextNode.status !== 'continue') return;

      this.executeNode(nextNode.node, {
        node,
        value: execResult.value,
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);

      if (this.state !== WorkflowRunnerState.Running) return;

      if (error instanceof WorkflowRunnerNodeError) {
        this.state = WorkflowRunnerState.Error;
        this.emit('error', error.message);
        return;
      }

      if (!node.data.$errorHandler) {
        this.state = WorkflowRunnerState.Error;
        this.emit('error', (<Error>error).message);
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

      this.state = WorkflowRunnerState.Error;
      this.emit('error', (<Error>error).message);
    }
  }

  destroy() {
    Object.values(this.nodeHandlers).forEach((nodeHandler) => {
      nodeHandler.destroy();
    });

    this.sandbox.destroy();
    this.nodesIdxMap.clear();
    this.dataStorage.destroy();
    this.removeAllListeners();

    this.stepCount = 0;

    // @ts-expect-error clear value
    this.workflow = null;
    this.startNodeId = '';
    // @ts-expect-error clear value
    this.nodeHandlers = {};
  }
}

export default WorkflowRunner;
