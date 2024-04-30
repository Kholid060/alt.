import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
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
import { CommandLaunchBy } from '@repo/extension';
import type { ExtensionCommandExecutePayloadWithData } from '#packages/common/interface/extension.interface';

type CommandDataWithPath = DatabaseExtensionCommandWithExtension & {
  filePath: string;
};

function executeCommandPromise(
  executePayload: ExtensionCommandExecutePayloadWithData,
) {
  return new Promise((resolve, reject) => {
    ExtensionCommandRunner.instance
      .execute(executePayload)
      .then(({ runner }) => {
        runner.once('finish', (_, value) => resolve(value));
        runner.once('error', (message) => reject(new Error(message)));
      })
      .catch(reject);
  });
}

export class NodeHandlerCommand extends WorkflowNodeHandler<WORKFLOW_NODE_TYPE.COMMAND> {
  private inputtedConfigCache: Set<string> = new Set();
  private commandDataCache: Record<string, CommandDataWithPath> = {};

  constructor() {
    super(WORKFLOW_NODE_TYPE.COMMAND);
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
  }: WorkflowNodeHandlerExecute<WORKFLOW_NODE_TYPE.COMMAND>): Promise<WorkflowNodeHandlerExecuteReturn> {
    const { commandId, extensionId } = node.data;

    const inputtedConfigCacheId = `command-confg:${node.id}`;
    if (!this.inputtedConfigCache.has(inputtedConfigCacheId)) {
      const commandConfig = await IPCRenderer.invoke(
        'extension:is-config-inputted',
        extensionId,
        commandId,
      );
      if (isIPCEventError(commandConfig)) {
        throw new WorkflowRunnerNodeError(commandConfig.message);
      }
      if (commandConfig.requireInput) {
        throw new WorkflowRunnerNodeError(
          'Missing config! Input the command config before using it.',
        );
      }

      this.inputtedConfigCache.add(inputtedConfigCacheId);
    }

    const command = await this.getCommandData({
      commandId,
      extensionId,
      nodeId: node.id,
    });
    const value = await executeCommandPromise({
      command,
      commandId,
      extensionId,
      launchContext: {
        args: node.data.commandData ?? {},
        launchBy: CommandLaunchBy.WORKFLOW,
      },
      commandFilePath: command.filePath,
    });

    return { value };
  }

  destroy(): void {
    this.commandDataCache = {};
    this.inputtedConfigCache.clear();
  }
}

export default NodeHandlerCommand;
