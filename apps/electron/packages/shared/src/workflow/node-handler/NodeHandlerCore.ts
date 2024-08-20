/* eslint-disable drizzle/enforce-delete-with-where */
import IPCRenderer from '#packages/common/utils/IPCRenderer';
import { isIPCEventError } from '#packages/common/utils/helper';
import { ExtensionAPI } from '@altdot/extension';
import type {
  WorkflowNodeHandlerExecute,
  WorkflowNodeHandlerExecuteReturn,
} from './WorkflowNodeHandler';
import WorkflowNodeHandler from './WorkflowNodeHandler';
import { NodeInvalidType } from '/@/utils/custom-errors';
import { getExactType, isValidType, promiseWithSignal } from '/@/utils/helper';
import { clipboard, nativeImage } from 'electron';
import { testNodeConditions } from '../utils/test-node-condtion';
import { WORKFLOW_NODE_TYPE } from '@altdot/workflow/dist/const/workflow-nodes-type.const';

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
      throw new NodeInvalidType(getExactType(node.data.delayMs), ['Number']);
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
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.NOTIFICATION>): Promise<WorkflowNodeHandlerExecuteReturn> {
    IPCRenderer.send('notification:show', node.data);

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

  private async pasteClipboard() {
    const result = await IPCRenderer.invoke('clipboard:paste');
    if (isIPCEventError(result)) throw new Error(result.message);

    return null;
  }

  private async readClipboard(
    format: ExtensionAPI.Clipboard.ClipboardContentType,
  ) {
    switch (format) {
      case 'html':
        return clipboard.readHTML();
      case 'image':
        return clipboard.readImage().toDataURL();
      case 'text':
        return clipboard.readText();
      case 'rtf':
        return clipboard.readRTF();
      default:
        throw new Error(`"${format}" is invalid clipboard format`);
    }
  }

  private async writeClipboard(
    format: ExtensionAPI.Clipboard.ClipboardContentType,
    value: unknown,
  ) {
    if (!isValidType(value, ['String'])) {
      throw new NodeInvalidType(getExactType(value), ['String']);
    }

    switch (format) {
      case 'html':
        return clipboard.writeHTML(value);
      case 'image':
        return clipboard.writeImage(nativeImage.createFromDataURL(value));
      case 'text':
        return clipboard.writeText(value);
      case 'rtf':
        return clipboard.writeRTF(value);
      default:
        throw new Error(`"${format}" is invalid clipboard format`);
    }
  }

  async execute({
    node,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.CLIPBOARD>): Promise<WorkflowNodeHandlerExecuteReturn> {
    let value: unknown = null;

    switch (node.data.action) {
      case 'paste':
        value = await this.pasteClipboard();
        break;
      case 'read': {
        value = await this.readClipboard(node.data.format);
        break;
      }
      case 'write':
        await this.writeClipboard(node.data.format, node.data.newClipboardVal);
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
