import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/workflow.const';
import WorkflowNodeHandler from './WorkflowNodeHandler';
import IPCRenderer from '#packages/common/utils/IPCRenderer';
import { isIPCEventError } from '#packages/common/utils/helper';
import { WorkflowRunnerNodeError } from '../runner/workflow-runner-errors';
import type { DatabaseExtensionCommandWithExtension } from '#packages/main/src/interface/database.interface';
import type {
  WorkflowNodeHandlerExecute,
  WorkflowNodeHandlerExecuteReturn,
} from './WorkflowNodeHandler';
import ExtensionCommandRunner from '/@/extension/ExtensionCommandRunner';
import { CommandLaunchBy } from '@alt-dot/extension';
import type { ExtensionCommandExecutePayloadWithData } from '#packages/common/interface/extension.interface';
import type { ExtensionCommandArgument } from '@alt-dot/extension-core';
import type { WorkflowRunnerBrowserContext } from '../runner/WorklowRunnerBrowser';

type CommandDataWithPath = DatabaseExtensionCommandWithExtension & {
  filePath: string;
};

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
  private commandDataCache: Record<string, CommandDataWithPath> = {};

  private commandRunnerIds: Set<string> = new Set();

  constructor() {
    super(WORKFLOW_NODE_TYPE.COMMAND);
  }

  private executeCommandPromise(
    executePayload: ExtensionCommandExecutePayloadWithData,
  ) {
    return new Promise((resolve, reject) => {
      ExtensionCommandRunner.instance
        .execute(executePayload)
        .then(({ runner }) => {
          this.commandRunnerIds.add(runner.id);
          runner.once('finish', (_, value) => {
            this.commandRunnerIds.delete(runner.id);
            resolve(value);
          });
          runner.once('error', (message) => {
            this.commandRunnerIds.delete(runner.id);
            reject(new Error(message));
          });
        })
        .catch(reject);
    });
  }

  private async getCommandData({
    nodeId,
    commandId,
    extensionId,
  }: {
    nodeId: string;
    commandId: string;
    extensionId: string;
  }) {
    const commandDataCacheId = `command-data:${nodeId}`;

    let command = this.commandDataCache[commandDataCacheId];
    if (command) return command;

    const [commandData, commandFilePath] = await Promise.all([
      IPCRenderer.invoke('database:get-command', {
        extensionId,
        commandId,
      }),
      IPCRenderer.invoke(
        'extension:get-command-file-path',
        extensionId,
        commandId,
      ),
    ]);

    let errorMessage =
      commandData === null || commandFilePath === null
        ? "Couldn't find command data"
        : '';
    if (isIPCEventError(commandData)) {
      errorMessage = commandData.message;
    } else if (isIPCEventError(commandFilePath)) {
      errorMessage = commandFilePath.message;
    }

    if (errorMessage) throw new WorkflowRunnerNodeError(errorMessage);

    command = {
      ...commandData,
      filePath: commandFilePath,
    } as CommandDataWithPath;

    this.commandDataCache[commandDataCacheId] = command;

    return command;
  }

  async execute({
    node,
    runner,
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.COMMAND>): Promise<WorkflowNodeHandlerExecuteReturn> {
    const { commandId, extension } = node.data;

    validateCommandArgument(node.data.args, node.data.argsValue);

    const inputtedConfigCacheId = `command-confg:${node.id}`;
    if (!this.inputtedConfigCache.has(inputtedConfigCacheId)) {
      const commandConfig = await IPCRenderer.invoke(
        'extension:is-config-inputted',
        extension.id,
        commandId,
      );
      if (isIPCEventError(commandConfig)) {
        throw new WorkflowRunnerNodeError(commandConfig.message);
      }
      if (commandConfig.requireInput) {
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

    const command = await this.getCommandData({
      commandId,
      nodeId: node.id,
      extensionId: extension.id,
    });
    const value = await this.executeCommandPromise({
      command,
      commandId,
      extensionId: extension.id,
      launchContext: {
        args: node.data.argsValue ?? {},
        launchBy: CommandLaunchBy.WORKFLOW,
      },
      commandFilePath: command.filePath,
      browserCtx: browserCtx
        ? {
            url: browserCtx.url,
            title: browserCtx.title,
            tabId: browserCtx.tabId as number,
            browserId: browserCtx.browserId as string,
          }
        : undefined,
    });

    return { value };
  }

  destroy(): void {
    this.commandDataCache = {};
    this.inputtedConfigCache.clear();

    this.commandRunnerIds.forEach((runnerId) => {
      ExtensionCommandRunner.instance.stop(runnerId);
    });
    this.commandRunnerIds.clear();
  }
}

export default NodeHandlerCommand;
