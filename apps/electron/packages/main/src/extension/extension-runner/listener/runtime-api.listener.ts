import { Injectable } from '@nestjs/common';
import { ExtensionApiEvent } from '../events/extension-api.event';
import { OnExtensionAPI } from '/@/common/decorators/extension.decorator';
import { ExtensionConfigService } from '../../extension-config/extension-config.service';
import { BrowserWindowService } from '/@/browser-window/browser-window.service';
import { ExtensionManifest } from '@altdot/extension/dist/extension-manifest';

@Injectable()
export class ExtensionRuntimeApiListener {
  constructor(
    private browserWindow: BrowserWindowService,
    private extensionConfig: ExtensionConfigService,
  ) {}

  @OnExtensionAPI('runtime.config.getValues')
  async getConfigValues({
    args: [type = 'command'],
    context: { commandId, extensionId, extension },
  }: ExtensionApiEvent<'runtime.config.getValues'>) {
    const configId =
      type === 'command' ? `${extensionId}:${commandId}` : extensionId;
    const configValues = await this.extensionConfig.getConfigs(configId);
    if (!configValues || !configValues.value) {
      const command = extension.commands.find(
        (command) => command.name === commandId,
      );
      if (!command || !command.config) return {};

      return command.config.reduce<Record<string, unknown>>((acc, curr) => {
        if (Object.hasOwn(curr, 'defaultValue')) {
          acc[curr.name] = curr.defaultValue;
        }

        return acc;
      }, {}) as object;
    }

    return configValues.value;
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

    const windowCommand = await this.browserWindow.getOrCreate('command');
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
}
