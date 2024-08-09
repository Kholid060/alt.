import { Injectable } from '@nestjs/common';
import { ExtensionApiEvent } from '../events/extension-api.event';
import { OnExtensionAPI } from '/@/common/decorators/extension.decorator';
import { CommandLaunchBy, ExtensionAPI } from '@altdot/extension';
import { ExtensionCommandService } from '../../extension-command/extension-command.service';
import { isObject } from '@altdot/shared';
import { ExtensionRunnerService } from '../../extension-runner/extension-runner.service';

@Injectable()
export class ExtensionCommandApiListener {
  constructor(
    private extensionRunner: ExtensionRunnerService,
    private extensionCommand: ExtensionCommandService,
  ) {}

  @OnExtensionAPI('command.updateDetail')
  async updateCommand({
    args: [{ subtitle }],
    context: { extensionId, commandId },
  }: ExtensionApiEvent<'command.updateDetail'>) {
    if (typeof subtitle === 'undefined') return;

    await this.extensionCommand.updateCommand(
      { commandId, extensionId },
      { subtitle },
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
