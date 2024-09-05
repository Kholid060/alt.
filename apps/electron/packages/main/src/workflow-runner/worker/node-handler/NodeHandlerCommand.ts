/* eslint-disable drizzle/enforce-delete-with-where */
import WorkflowNodeHandler from './WorkflowNodeHandler';
import { isIPCEventError } from '#packages/common/utils/helper';
import { WorkflowRunnerNodeError } from '../runner/workflow-runner-errors';
import type {
  WorkflowNodeHandlerExecute,
  WorkflowNodeHandlerExecuteReturn,
} from './WorkflowNodeHandler';
import { CommandLaunchBy } from '@altdot/extension';
import type { WorkflowRunnerBrowserContext } from '../runner/WorklowRunnerBrowser';
import { WORKFLOW_NODE_TYPE } from '@altdot/workflow/dist/const/workflow-nodes-type.const';
import { ExtensionCommandArgument } from '@altdot/extension/dist/extension-manifest';

function validateCommandArgument(
  args: ExtensionCommandArgument[],
  argsValue: Record<string, unknown>,
) {
  const expectedType = (
    name: string,
    value: unknown,
    expected: 'number' | 'string' | 'boolean',
  ) => {
    if (typeof value === expected) return;

    throw new Error(
      `"${name}" argument expected "${expected}" as value but got "${typeof value}"`,
    );
  };

  for (const arg of args) {
    if (!Object.hasOwn(argsValue, arg.name)) {
      if (arg.required) {
        throw new Error(`"${arg.title}" argument is required`);
      }

      continue;
    }

    switch (arg.type) {
      case 'input:text':
      case 'input:password':
      case 'select': {
        expectedType(arg.title, argsValue[arg.name], 'string');
        break;
      }
      case 'input:number':
        expectedType(arg.title, argsValue[arg.name], 'number');
        break;
      case 'toggle':
        expectedType(arg.title, argsValue[arg.name], 'boolean');
        break;
    }
  }
}

export class NodeHandlerCommand extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.COMMAND> {
  private inputtedConfigCache: Set<string> = new Set();

  constructor() {
    super(WORKFLOW_NODE_TYPE.COMMAND);
  }

  async execute({
    node,
    runner,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.COMMAND>): Promise<WorkflowNodeHandlerExecuteReturn> {
    const { commandId, extension } = node.data;

    validateCommandArgument(node.data.args, node.data.argsValue);

    const inputtedConfigCacheId = `command-confg:${node.id}`;
    if (!this.inputtedConfigCache.has(inputtedConfigCacheId)) {
      const commandConfig = await runner.ipc.invoke(
        'extension:is-config-inputted',
        extension.id,
        commandId,
      );
      if (isIPCEventError(commandConfig)) {
        throw new WorkflowRunnerNodeError(commandConfig.message);
      }
      if (typeof commandConfig === 'string') {
        throw new WorkflowRunnerNodeError(
          'Missing config! Input the command config before using this command.',
        );
      }

      this.inputtedConfigCache.add(inputtedConfigCacheId);
    }

    let browserCtx: WorkflowRunnerBrowserContext | null =
      runner.browser.getContext();
    if (browserCtx.tabId === null || browserCtx.browserId === null) {
      browserCtx = null;
    }

    const value = await runner.ipc.invoke(
      'extension:execute-command',
      {
        commandId,
        extensionId: extension.id,
        launchContext: {
          args: node.data.argsValue ?? {},
          launchBy: CommandLaunchBy.WORKFLOW,
        },
        browserCtx: browserCtx
          ? {
              url: browserCtx.url,
              title: browserCtx.title,
              tabId: browserCtx.tabId as number,
              browserId: browserCtx.browserId as string,
            }
          : undefined,
      },
      {
        waitUntilFinished: true,
      },
    );

    return { value };
  }

  destroy(): void {
    this.inputtedConfigCache.clear();
  }
}

export default NodeHandlerCommand;
