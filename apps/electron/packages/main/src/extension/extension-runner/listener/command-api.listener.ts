import { Injectable } from '@nestjs/common';
import { ExtensionApiEvent } from '../events/extension-api.event';
import { OnExtensionAPI } from '/@/common/decorators/extension.decorator';
import { CommandLaunchBy, ExtensionAPI } from '@altdot/extension';
import { isObject } from '@altdot/shared';
import { ExtensionRunnerService } from '../../extension-runner/extension-runner.service';
import { DBService } from '/@/db/db.service';
import { extensionCommands } from '/@/db/schema/extension.schema';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class ExtensionCommandApiListener {
  constructor(
    private dbService: DBService,
    private extensionRunner: ExtensionRunnerService,
  ) {}

  @OnExtensionAPI('command.updateDetail')
  async updateCommand({
    args: [{ subtitle }],
    context: { extensionId, commandId },
  }: ExtensionApiEvent<'command.updateDetail'>) {
    if (typeof subtitle === 'undefined') return;

    await this.dbService.db
      .update(extensionCommands)
      .set({
        subtitle,
      })
      .where(
        and(
          eq(extensionCommands.id, commandId),
          eq(extensionCommands.extensionId, extensionId),
        ),
      );
  }

  @OnExtensionAPI('command.launch')
  async commandLaunch({
    args: [options],
    context: { extensionId },
  }: ExtensionApiEvent<'command.launch'>): Promise<ExtensionAPI.Command.LaunchResult | null> {
    if (typeof options.args !== 'undefined' && !isObject(options.args)) {
      throw new Error('The "args" options type must be an object.');
    }

    try {
      const waitUntilFinished = options.waitUntilFinished ?? true;
      const result = await this.extensionRunner.executeCommand(
        {
          extensionId,
          launchContext: {
            args: options.args ?? {},
            launchBy: CommandLaunchBy.COMMAND,
          },
          commandId: options.name,
          scriptOptions: options.captureAllScriptMessages
            ? { captureAllMessages: true }
            : undefined,
        },
        { waitUntilFinished },
      );
      if (!waitUntilFinished || typeof result === 'string') return null;

      return result;
    } catch (error) {
      return {
        success: false,
        errorMessage: (error as Error).message,
      };
    }
  }
}
