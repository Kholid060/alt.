import { Injectable } from '@nestjs/common';
import { ExtensionApiEvent } from '../events/extension-api.event';
import { OnExtensionAPI } from '/@/common/decorators/extension.decorator';
import { ExtensionConfigService } from '../../extension-config/extension-config.service';
import { BrowserWindowService } from '/@/browser-window/browser-window.service';
import { CustomError } from '#packages/common/errors/custom-errors';
import { CommandLaunchBy } from '@altdot/extension/dist/interfaces/command.interface';
import { isObject } from '@altdot/shared';
import { ExtensionCommandService } from '../../extension-command/extension-command.service';
import { ExtensionService } from '../../extension.service';
import { ExtensionManifest } from '@altdot/extension/dist/extension-manifest';

@Injectable()
export class ExtensionRuntimeApiListener {
  constructor(
    private extension: ExtensionService,
    private browserWindow: BrowserWindowService,
    private extensionConfig: ExtensionConfigService,
    private extensionCommand: ExtensionCommandService,
  ) {}

  @OnExtensionAPI('runtime.config.getValues')
  async getConfigValues({
    args: [type = 'command'],
    context: { commandId, extensionId },
  }: ExtensionApiEvent<'runtime.config.getValues'>) {
    const configId =
      type === 'command' ? `${extensionId}:${commandId}` : extensionId;
    const configValues = await this.extensionConfig.getConfigs(configId);

    return (configValues?.value ?? {}) as object;
  }

  @OnExtensionAPI('runtime.config.openConfigPage')
  async openConfigPage({
    args: [type = 'command'],
    context: { extension, commandId, extensionId },
  }: ExtensionApiEvent<'runtime.config.openConfigPage'>) {
    if (type === 'extension') {
      if (!extension.config?.length) return Promise.resolve();
    } else if (type === 'command') {
      const command = extension.commands.find(
        (command) => command.name === commandId,
      );
      if (!command?.config?.length) return Promise.resolve();
    }

    const windowCommand = await this.browserWindow.get('command');
    await windowCommand.toggleWindow(true);
    await windowCommand.sendMessage('command-window:input-config', {
      type,
      commandId,
      extensionId,
    });
  }

  @OnExtensionAPI('runtime.getManifest')
  getManifest({
    context: { extension },
  }: ExtensionApiEvent<'runtime.getManifest'>) {
    return Promise.resolve(extension as ExtensionManifest);
  }

  @OnExtensionAPI('runtime.command.updateDetail')
  async updateCommand({
    args: [{ subtitle }],
    context: { extensionId, commandId },
  }: ExtensionApiEvent<'runtime.command.updateDetail'>) {
    if (typeof subtitle === 'undefined') return;

    await this.extensionCommand.updateCommand(
      { commandId, extensionId },
      { subtitle },
    );
  }

  @OnExtensionAPI('runtime.command.launch')
  commandLaunch({
    args: [options],
    context: { extensionId },
  }: ExtensionApiEvent<'runtime.command.launch'>) {
    if (typeof options.args !== 'undefined' && !isObject(options.args)) {
      throw new Error('The "args" options type must be an object.');
    }

    return this.extension
      .executeCommandAndWait({
        extensionId,
        launchContext: {
          args: options.args ?? {},
          launchBy: CommandLaunchBy.COMMAND,
        },
        commandId: options.name,
      })
      .catch((error) => {
        throw new CustomError(error);
      });
  }
}
