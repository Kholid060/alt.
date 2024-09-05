/* eslint-disable drizzle/enforce-delete-with-where */
import type {
  WorkflowNodeHandlerExecute,
  WorkflowNodeHandlerExecuteReturn,
} from './WorkflowNodeHandler';
import WorkflowNodeHandler from './WorkflowNodeHandler';
import { testNodeConditions } from '../utils/test-node-condtion';
import { WORKFLOW_NODE_TYPE } from '@altdot/workflow/dist/const/workflow-nodes-type.const';
import {
  isValidType,
  getExactType,
  promiseWithSignal,
} from '../utils/workflow-runner-utils';
import { NodeInvalidTypeError } from '../utils/custom-errors';

export class NodeHandlerCode extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.CODE> {
  private controller = new AbortController();

  constructor() {
    super(WORKFLOW_NODE_TYPE.CODE);
  }

  async execute({
    node,
    runner,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.CODE>): Promise<WorkflowNodeHandlerExecuteReturn> {
    const code = `(async () => {\n${node.data.jsCode}\n})()`;
    const result = await runner.sandbox.evaluateCode(code, {
      node,
      isPromise: true,
      signal: this.controller.signal,
    });

    return {
      value: result,
    };
  }

  destroy() {
    this.controller.abort();
  }
}

export class NodeHandlerDelay extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.DELAY> {
  private controller = new AbortController();
  private timers = new Set<NodeJS.Timeout>();

  constructor() {
    super(WORKFLOW_NODE_TYPE.DELAY);
  }

  async execute({
    node,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.DELAY>): Promise<WorkflowNodeHandlerExecuteReturn> {
    if (!isValidType(node.data.delayMs, ['Number'])) {
      throw new NodeInvalidTypeError(getExactType(node.data.delayMs), [
        'Number',
      ]);
    }

    await promiseWithSignal((resolve) => {
      const timeout = setTimeout(() => {
        this.timers.delete(timeout);
        resolve();
      }, node.data.delayMs);
      this.timers.add(timeout);
    }, this.controller.signal);

    return {
      value: null,
    };
  }

  destroy() {
    this.controller.abort();
    this.timers.forEach((value) => {
      clearTimeout(value);
    });

    this.timers.clear();
  }
}

export class NodeHandlerConditional extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.CONDITIONAL> {
  private controller = new AbortController();
  private timers = new Set<NodeJS.Timeout>();

  constructor() {
    super(WORKFLOW_NODE_TYPE.CONDITIONAL);
  }

  async execute({
    node,
    runner,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.CONDITIONAL>): Promise<WorkflowNodeHandlerExecuteReturn> {
    let nextNodeHandle = 'condition-fallback';

    for (const condition of node.data.conditions) {
      const isConditionMatch = await testNodeConditions({
        name: condition.name,
        conditions: condition.items,
        evaluateExpression: (exp) => runner.sandbox.evaluateExpression(exp),
      });
      if (isConditionMatch) {
        nextNodeHandle = `condition-${condition.id}`;
        break;
      }
    }

    return {
      value: null,
      nextNodeHandle,
    };
  }

  destroy() {
    this.controller.abort();
    this.timers.forEach((value) => {
      clearTimeout(value);
    });

    this.timers.clear();
  }
}

export class NodeHandlerNotification extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.NOTIFICATION> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.NOTIFICATION, {
      dataValidation: [
        { key: 'body', name: 'Body', types: ['String'] },
        { key: 'title', name: 'Title', types: ['String'] },
        { key: 'silent', name: 'Silent', types: ['Boolean'] },
      ],
    });
  }

  async execute({
    node,
    runner,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.NOTIFICATION>): Promise<WorkflowNodeHandlerExecuteReturn> {
    runner.ipc.send('notification:show', node.data);

    return {
      value: null,
    };
  }

  destroy() {}
}

export class NodeHandlerClipboard extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.CLIPBOARD> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.CLIPBOARD);
  }

  async execute({
    node,
    runner,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.CLIPBOARD>): Promise<WorkflowNodeHandlerExecuteReturn> {
    let value: unknown = null;

    switch (node.data.action) {
      case 'paste':
        await runner.ipc.invoke('clipboard:paste');
        break;
      case 'read': {
        value = await runner.ipc.invoke('clipboard:read', node.data.format);
        break;
      }
      case 'write':
        await runner.ipc.invoke(
          'clipboard:write',
          node.data.format,
          node.data.newClipboardVal,
        );
        break;
    }

    return { value };
  }

  destroy() {}
}

export class NodeHandlerInsertData extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.INSERT_DATA> {
  constructor() {
    super(WORKFLOW_NODE_TYPE.INSERT_DATA);
  }

  execute({
    node,
    runner,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.INSERT_DATA>): WorkflowNodeHandlerExecuteReturn {
    const items: Record<PropertyKey, unknown> = {};

    for (const item of node.data.items) {
      items[item.name] = runner.dataStorage.variables.setVariable(
        item.name,
        item.value,
        item.mode,
      );
    }

    return {
      value: items,
    };
  }

  destroy() {}
}
