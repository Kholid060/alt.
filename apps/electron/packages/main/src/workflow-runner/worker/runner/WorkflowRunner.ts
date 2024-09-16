import dayjs from 'dayjs';
import EventEmitter from 'eventemitter3';
import type { WorkflowRunnerRunPayload } from '#packages/common/interface/workflow-runner.interace';
import { WORKFLOW_MANUAL_TRIGGER_ID } from '#packages/common/utils/constant/workflow.const';
import type { WorkflowEmitEvents } from '#packages/common/interface/workflow.interface';
import type WorkflowNodeHandler from '../node-handler/WorkflowNodeHandler';
import { WorkflowRunnerNodeError } from './workflow-runner-errors';
import { sleep } from '@altdot/shared';
import WorkflowRunnerData from './WorkflowRunnerData';
import type { WorkflowNodeHandlerExecuteReturn } from '../node-handler/WorkflowNodeHandler';
import WorkflowRunnerSandbox from './WorkflowRunnerSandbox';
import { nanoid } from 'nanoid';
import WorkflowRunnerBrowser from './WorklowRunnerBrowser';
import { WorkflowDetailModel } from '#packages/main/src/workflow/workflow.interface';
import { WORKFLOW_NODE_TYPE, WorkflowNodes } from '@altdot/workflow';
import {
  getWorkflowNodeConnectionsMap,
  validateTypes,
  WorkflowNodeConnectionMap,
} from '../utils/workflow-runner-utils';
import WorkflowRunnerLogger from './WorkflowRunnerLogger';
import { WorkflowRunnerMessagePort } from '../../interfaces/workflow-runner.interface';
import WorkflowRunnerIPC from './WorkflowRunnerIPC';

export type NodeHandlersObj = Record<
  WORKFLOW_NODE_TYPE,
  WorkflowNodeHandler<WORKFLOW_NODE_TYPE>
>;

export interface WorkflowRunnerParent {
  id: string;
  vars: Record<PropertyKey, unknown>;
}

export interface WorkflowRunnerOptions extends WorkflowRunnerRunPayload {
  id: string;
  nodeHandlers: NodeHandlersObj;
  messagePort: WorkflowRunnerMessagePort;
  parentWorkflow?: WorkflowRunnerParent;
}

export interface WorkflowRunnerEvents {
  finish: (reason: WorkflowRunnerFinishReason) => void;
  error: (error: { message: string; node?: WorkflowNodes }) => void;
  'node:execute-finish': (
    node: WorkflowNodes,
    result: WorkflowNodeHandlerExecuteReturn,
  ) => void;
  'node:execute-error': (node: WorkflowNodes, message: string) => void;
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

export interface WorkflowRunnerPrevNodeExecution {
  value: unknown;
  execTime?: number;
  node: WorkflowNodes;
  retryCount?: number;
  isRetrying?: boolean;
}

class WorkflowRunner extends EventEmitter<WorkflowRunnerEvents> {
  private startNodeId: string;
  private nodeHandlers: NodeHandlersObj;
  private readonly finishNodeId?: string;
  private nodesIdxMap: Map<string, number>;
  private nodeExecutionQueue: string[] = [];
  private emitEvents: Partial<Record<keyof WorkflowEmitEvents, boolean>>;

  id: string;
  startedAt: string;
  stepCount: number = 0;
  readonly logDir: string;
  readonly maxStep: number;
  state: WorkflowRunnerState;
  readonly workflow: WorkflowDetailModel;
  connectionsMap: Record<string, WorkflowNodeConnectionMap> = {};

  readonly ipc: WorkflowRunnerIPC;
  readonly logger: WorkflowRunnerLogger;
  readonly browser: WorkflowRunnerBrowser;
  readonly dataStorage: WorkflowRunnerData = new WorkflowRunnerData(this);
  readonly sandbox: WorkflowRunnerSandbox = new WorkflowRunnerSandbox(this);

  readonly parentWorkflow: WorkflowRunnerParent | null;

  constructor({
    id,
    logDir,
    workflow,
    emitEvents,
    messagePort,
    startNodeId,
    nodeHandlers,
    finishNodeId,
    parentWorkflow,
    maxStep = Infinity,
  }: WorkflowRunnerOptions) {
    super();

    this.id = id;
    this.logDir = logDir;
    this.maxStep = maxStep;
    this.workflow = workflow;
    this.startNodeId = startNodeId;
    this.nodeHandlers = nodeHandlers;
    this.finishNodeId = finishNodeId;
    this.parentWorkflow = parentWorkflow ?? null;

    this.ipc = new WorkflowRunnerIPC(messagePort);
    this.browser = new WorkflowRunnerBrowser(this.ipc);
    this.logger = new WorkflowRunnerLogger(this, logDir);

    this.emitEvents = {
      'node:execute-finish': false,
      'node:execute-error': false,
      ...emitEvents,
    };

    this.state = WorkflowRunnerState.Idle;
    this.startedAt = new Date().toString();

    this.nodesIdxMap = new Map(
      workflow.nodes.map((node, index) => [node.id, index]),
    );
  }

  async start() {
    if (this.state !== WorkflowRunnerState.Idle) return;

    const startNode = this.workflow.nodes.find((node) => {
      if (this.startNodeId === WORKFLOW_MANUAL_TRIGGER_ID) {
        return node.type === WORKFLOW_NODE_TYPE.TRIGGER;
      }

      return node.id === this.startNodeId;
    });
    if (!startNode) {
      this.state = WorkflowRunnerState.Error;
      this.emit('error', { message: "Couldn't find the starting node" });
      return;
    }

    this.logger.instance.info('Start executing');

    // Init Connection Map
    this.connectionsMap = getWorkflowNodeConnectionsMap(
      this.workflow.nodes,
      this.workflow.edges,
    );

    // Store workflow initial variable
    const varExpValue: Record<string, string> = {
      date: dayjs().format('DD-MM-YYYY'),
      currentTime: dayjs().format('HH:mm:ss'),
      clipboard: await this.ipc.invoke('clipboard:read', 'text'),
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

    this.startedAt = new Date().toString();
    this.executeNode(startNode as WorkflowNodes);
  }

  stop() {
    this.state = WorkflowRunnerState.Stop;
    this.emit('finish', WorkflowRunnerFinishReason.Stop);
  }

  private getNode(nodeId: string): WorkflowNodes | null {
    if (!this.nodesIdxMap.has(nodeId)) return null;

    const nodeIndex = this.nodesIdxMap.get(nodeId)!;

    return (this.workflow.nodes[nodeIndex] as WorkflowNodes) ?? null;
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
      this.emit('error', {
        message: `Couldn't find node with "${nodeId}" id`,
      });

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
      this.emit('error', { message: "Couldn't find the next node" });

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
    const startExecTime = prevExec?.execTime ?? Date.now();
    try {
      if (this.state !== WorkflowRunnerState.Running) return;

      if (this.stepCount >= this.maxStep) {
        this.state = WorkflowRunnerState.Finish;
        this.emit('finish', WorkflowRunnerFinishReason.Done);
        return;
      }

      if (node.id === prevExec?.node.id) {
        this.state = WorkflowRunnerState.Error;
        this.emit('error', {
          node,
          message: 'Stopped to prevent infinite loop',
        });
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
        this.dataStorage.nodeData.set('currentNode', {
          id: node.id,
          type: node.type,
        });

        const renderedNode = await this.evaluateNodeExpression(node);
        if (nodeHandler.dataValidation) {
          validateTypes(renderedNode.data, nodeHandler.dataValidation);
        }

        if (!prevExec?.isRetrying) {
          this.logger.logNode('info', node, 'Start executing node');
        }

        execResult = await nodeHandler.execute({
          runner: this,
          node: renderedNode,
          prevExecution: prevExec,
        });

        if (node.data.$outputVarName) {
          this.dataStorage.variables.setVariable(
            node.data.$outputVarName,
            execResult.value,
            node.data.$outputVarMode,
          );
        }
        if (this.emitEvents['node:execute-finish']) {
          this.emit('node:execute-finish', node, execResult);
        }

        this.logger.logNode(
          'info',
          node,
          `Finish executing node in ${Date.now() - startExecTime}ms`,
        );
      }

      if (node.id === this.finishNodeId) {
        this.state = WorkflowRunnerState.Finish;
        this.emit('finish', WorkflowRunnerFinishReason.Done);
        return;
      }

      this.dataStorage.nodeData.set('prevNode', {
        id: node.id,
        value: execResult.value,
      });

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

      if (
        error instanceof WorkflowRunnerNodeError ||
        !node.data.$errorHandler
      ) {
        this.state = WorkflowRunnerState.Error;

        const message = (<Error>error).message;

        if (this.emitEvents['node:execute-error']) {
          this.emit('node:execute-error', node, message);
        }

        this.emit('error', {
          node,
          message,
        });
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
        this.logger.instance.info(
          `Retry node execution, ${prevExec?.retryCount ?? 1} of ${retryCount}`,
        );

        await sleep(retryIntervalMs);

        this.executeNode(node, {
          ...(prevExec || { value: null, node }),
          isRetrying: true,
          execTime: startExecTime,
          retryCount: (prevExec?.retryCount ?? 1) + 1,
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

      if (this.emitEvents['node:execute-error']) {
        this.emit('node:execute-error', node, (<Error>error).message);
      }

      this.state = WorkflowRunnerState.Error;
      this.emit('error', {
        node,
        message: (<Error>error).message,
      });
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
