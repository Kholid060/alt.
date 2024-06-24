import { dialog } from 'electron';
import { logger } from '../lib/log';
import type { ExtensionCommandArgument } from '@alt-dot/extension-core';
import { APP_DEEP_LINK_SCHEME, parseJSON } from '@alt-dot/shared';
import { CommandLaunchBy } from '@alt-dot/extension';
import type { APP_DEEP_LINK_HOST } from '#packages/common/utils/constant/app.const';
import DBService from '../services/database/database.service';
import { isIPCEventError } from '#packages/common/utils/helper';
import { WORKFLOW_MANUAL_TRIGGER_ID } from '#packages/common/utils/constant/workflow.const';
import ExtensionService from '../services/extension.service';
import WorkflowService from '../services/workflow.service';
import StoreService from '../services/store.service';
import WindowCommand from '../window/command-window';

function convertArgValue(argument: ExtensionCommandArgument, value: string) {
  let convertedValue: unknown = value;

  switch (argument.type) {
    case 'toggle':
      convertedValue = Boolean(parseJSON(value, null));
      break;
    case 'input:number':
      convertedValue = parseInt(value);
      break;
  }

  return convertedValue;
}

type DeepLinkHost =
  (typeof APP_DEEP_LINK_HOST)[keyof typeof APP_DEEP_LINK_HOST];

class DeepLinkHandler {
  static async launchExtensionCommand({ pathname, searchParams }: URL) {
    const [_, extensionId, commandId] = pathname.split('/');

    const command = await DBService.instance.extension.getCommand({
      commandId,
      extensionId,
    });
    if (!command) return;

    if (!command.dismissAlert) {
      const { response } = await dialog.showMessageBox({
        type: 'question',
        message: `Run "${command.title}" command?`,
        detail:
          'This command was initiated from outside of the app. If you didn\'t initiate this, click the "Cancel" button.',
        buttons: ['Cancel', 'Run Anyway', 'Always Run'],
      });
      if (response === 0) return;

      if (response === 2) {
        await DBService.instance.extension.updateCommand(
          extensionId,
          commandId,
          {
            dismissAlert: true,
          },
        );
      }
    }

    const args: Record<number, string> = {};
    searchParams.forEach((value, key) => {
      if (!key.startsWith('arg_')) return;

      const argIndex = +key.split('_')[1];
      if (argIndex < 0 || Number.isNaN(argIndex)) return;

      args[argIndex] = value;
    });

    const requiredArgs: { name: string; index: number }[] = [];
    const commandArgs = (command.arguments ?? []).reduce<
      Record<string, unknown>
    >((acc, argument, index) => {
      if (Object.hasOwn(args, index)) {
        acc[argument.name] = convertArgValue(argument, args[index]);
      } else if (argument.required) {
        requiredArgs.push({
          index,
          name: argument.placeholder ?? argument.name,
        });
      }

      return acc;
    }, {});

    if (requiredArgs.length > 0) {
      const requiredArgsStr = requiredArgs
        .map((arg) => `- ${arg.name} (arg_${arg.index})`)
        .join('\n');
      dialog.showMessageBox({
        type: 'error',
        title: 'Missing Command Arguments',
        message: `The "${command.name}" is required these arguments:\n${requiredArgsStr}`,
      });
      return;
    }

    const launchContext = {
      args: commandArgs,
      launchBy: CommandLaunchBy.DEEP_LINK,
    };

    await ExtensionService.instance.executeCommand({
      commandId,
      extensionId,
      launchContext,
    });
  }

  static async launchWorkflow({ pathname }: URL) {
    const [_, workflowId] = pathname.split('/');
    const workflow = await DBService.instance.workflow.get(workflowId);
    if (!workflow || isIPCEventError(workflow) || workflow.isDisabled) return;

    if (!workflow.dismissAlert) {
      const { response } = await dialog.showMessageBox({
        type: 'question',
        message: `Run "${workflow.name}" workflow?`,
        detail:
          'This workflow was initiated from outside of the app. If you didn\'t initiate this, click the "Cancel" button.',
        buttons: ['Cancel', 'Run Anyway', 'Always Run'],
      });
      if (response === 0) return;

      if (response === 2) {
        await DBService.instance.workflow.update(workflowId, {
          dismissAlert: true,
        });
      }
    }

    await WorkflowService.instance.execute({
      id: workflow.id,
      startNodeId: WORKFLOW_MANUAL_TRIGGER_ID,
    });
  }

  static async storeHandler({ pathname }: URL) {
    const [_, type, itemId] = pathname.split('/');
    if (!itemId) return;

    if (type === 'extensions') {
      await WindowCommand.instance.toggleWindow(true);
      await WindowCommand.instance.sendMessage(
        { ensureWindow: true, name: 'app:update-route' },
        `/store/extensions/${itemId}/install`,
      );
    } else if (type === 'workflows') StoreService.installWorkflow(itemId);
  }
}

class DeepLink {
  static getURL(hostname: DeepLinkHost, path?: string) {
    return `${APP_DEEP_LINK_SCHEME}://${hostname}/${path || ''}`;
  }

  static async handler(url: string) {
    try {
      const urlObj = new URL(url);

      switch (urlObj.hostname) {
        case 'extensions':
          DeepLinkHandler.launchExtensionCommand(urlObj);
          break;
        case 'workflows':
          DeepLinkHandler.launchWorkflow(urlObj);
          break;
        case 'store':
          DeepLinkHandler.storeHandler(urlObj);
          break;
      }
    } catch (error) {
      logger('error', ['deepLinkHandler'], (error as Error).message);
    }
  }
}

export default DeepLink;
