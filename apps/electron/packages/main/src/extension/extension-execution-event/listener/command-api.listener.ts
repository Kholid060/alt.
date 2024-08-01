import { Injectable } from '@nestjs/common';
import { ExtensionApiEvent } from '../events/extension-api.event';
import { OnExtensionAPI } from '/@/common/decorators/extension.decorator';
import { ExtensionAPI, CommandLaunchBy } from '@altdot/extension';
import { ExtensionCommandService } from '../../extension-command/extension-command.service';
import { ExtensionService } from '../../extension.service';
import { isObject } from '@altdot/shared';

@Injectable()
export class ExtensionCommandApiListener {
  constructor(
    private extension: ExtensionService,
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
  }: ExtensionApiEvent<'command.launch'>): Promise<ExtensionAPI.Command.LaunchResult> {
    if (typeof options.args !== 'undefined' && !isObject(options.args)) {
      throw new Error('The "args" options type must be an object.');
    }

    try {
      return await this.extension.executeCommandAndWait({
        extensionId,
        launchContext: {
          args: options.args ?? {},
          launchBy: CommandLaunchBy.COMMAND,
        },
        commandId: options.name,
        scriptOptions: options.captureAllScriptMessages
          ? { captureAllMessages: true }
          : undefined,
      });
    } catch (error) {
      return {
        success: false,
        errorMessage: (error as Error).message,
      };
    }
  }
}
