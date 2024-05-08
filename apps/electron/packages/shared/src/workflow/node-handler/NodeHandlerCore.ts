import IPCRenderer from '#packages/common/utils/IPCRenderer';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
import { isIPCEventError } from '#packages/common/utils/helper';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import type {
  WorkflowNodeHandlerExecute,
  WorkflowNodeHandlerExecuteReturn,
} from './WorkflowNodeHandler';
import WorkflowNodeHandler from './WorkflowNodeHandler';
import { NodeInvalidType } from '/@/utils/custom-errors';
import { getExactType, isValidType, promiseWithSignal } from '/@/utils/helper';
import { clipboard, nativeImage } from 'electron';

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
    format: ExtensionAPI.clipboard.ClipboardContentType,
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
    format: ExtensionAPI.clipboard.ClipboardContentType,
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
    runner,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.CLIPBOARD>): Promise<WorkflowNodeHandlerExecuteReturn> {
    let value: unknown = null;

    switch (node.data.action) {
      case 'paste':
        value = await this.pasteClipboard();
        break;
      case 'read': {
        value = await this.readClipboard(node.data.format);
        if (node.data.insertToVar) {
          runner.dataStorage.variables.set(node.data.varName, value);
        }
        break;
      }
      case 'write':
        await this.writeClipboard(node.data.format, node.data.newClipboardVal);
        break;
    }

    console.log(runner.dataStorage.variables.getAll());

    return { value };
  }

  destroy() {}
}
