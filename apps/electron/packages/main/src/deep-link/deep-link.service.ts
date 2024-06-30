import { Injectable } from '@nestjs/common';
import { DBService } from '../db/db.service';
import { dialog } from 'electron';
import { extensionCommands } from '../db/schema/extension.schema';
import { eq } from 'drizzle-orm';
import { ExtensionCommandArgument } from '@alt-dot/extension-core';
import { parseJSON } from '@alt-dot/shared';
import { CommandLaunchBy } from '@alt-dot/extension';
import { ExtensionService } from '../extension/extension.service';
import { workflows } from '../db/schema/workflow.schema';
import { WorkflowService } from '../workflow/workflow.service';
import { WORKFLOW_MANUAL_TRIGGER_ID } from '#packages/common/utils/constant/workflow.const';
import { BrowserWindowService } from '../browser-window/browser-window.service';
import { LoggerService } from '../logger/logger.service';

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

@Injectable()
export class DeepLinkService {
  constructor(
    private dbService: DBService,
    private loggerService: LoggerService,
    private workflowService: WorkflowService,
    private extensionService: ExtensionService,
    private browserWindowService: BrowserWindowService,
  ) {}

  private async extensionHandler({ pathname, searchParams }: URL) {
    const [_, extensionId, commandId] = pathname.split('/');

    const commandDbId = `${extensionId}:${commandId}`;
    const command = await this.dbService.db.query.extensionCommands.findFirst({
      where(fields, operators) {
        return operators.eq(fields.id, commandDbId);
      },
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
        await this.dbService.db
          .update(extensionCommands)
          .set({
            dismissAlert: true,
          })
          .where(eq(extensionCommands.id, commandDbId));
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

    await this.extensionService.executeCommand({
      commandId,
      extensionId,
      launchContext,
    });
  }

  private async workflowHandler({ pathname }: URL) {
    const [_, workflowId] = pathname.split('/');
    const workflow = await this.dbService.db.query.workflows.findFirst({
      where(fields, operators) {
        return operators.eq(fields.id, workflowId);
      },
    });
    if (!workflow || workflow.isDisabled) return;

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
        await this.dbService.db
          .update(workflows)
          .set({
            dismissAlert: true,
          })
          .where(eq(workflows.id, workflowId));
      }
    }

    await this.workflowService.execute({
      id: workflow.id,
      startNodeId: WORKFLOW_MANUAL_TRIGGER_ID,
    });
  }

  private async storeHandler({ pathname }: URL) {
    const [_, type, itemId] = pathname.split('/');
    if (!itemId) return;

    if (type === 'extensions') {
      const windowcommand = await this.browserWindowService.get('command');
      await windowcommand.toggleWindow(true);
      await windowcommand.sendMessage(
        { ensureWindow: true, name: 'app:update-route' },
        `/store/extensions/${itemId}/install`,
      );
    } else if (type === 'workflows') {
      // TODO: install workflow
    }
  }

  async urlHandler(url: string) {
    try {
      const urlObj = new URL(url);

      switch (urlObj.hostname) {
        case 'extensions':
          this.extensionHandler(urlObj);
          break;
        case 'workflows':
          this.workflowHandler(urlObj);
          break;
        case 'store':
          this.storeHandler(urlObj);
          break;
      }
    } catch (error) {
      this.loggerService.error(['deepLinkHandler'], (error as Error).message);
    }
  }
}
