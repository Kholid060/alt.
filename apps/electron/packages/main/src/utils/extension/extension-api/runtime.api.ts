import { CommandLaunchBy } from '@repo/extension';
import ExtensionIPCEvent from '../ExtensionIPCEvent';
import DBService from '/@/services/database/database.service';
import ExtensionService from '/@/services/extension.service';
import { isObject } from '@repo/shared';
import { ExtensionError } from '#packages/common/errors/custom-errors';
import { z } from 'zod';
import WindowCommand from '../../../window/command-window';

const extensionConfigType = z.union([
  z.literal('command'),
  z.literal('extension'),
]);

ExtensionIPCEvent.instance.on(
  'runtime.config.getValues',
  async ({ commandId, extensionId }, type = 'command') => {
    const configId =
      type === 'command' ? `${extensionId}:${commandId}` : extensionId;
    const configValues =
      await DBService.instance.extension.getConfigValue(configId);

    return configValues?.value ?? {};
  },
  [extensionConfigType.optional().default('command')],
);
ExtensionIPCEvent.instance.on(
  'runtime.config.openConfigPage',
  async ({ extension, commandId, extensionId }, type = 'command') => {
    if (type === 'extension') {
      if (!extension.config?.length) return Promise.resolve();
    } else if (type === 'command') {
      const command = extension.commands.find(
        (command) => command.name === commandId,
      );
      if (!command?.config?.length) return Promise.resolve();
    }

    await WindowCommand.instance.toggleWindow(true);
    await WindowCommand.instance.sendMessage('command-window:input-config', {
      type,
      commandId,
      extensionId,
    });
  },
  [extensionConfigType],
);

ExtensionIPCEvent.instance.on('runtime.getManifest', ({ extension }) => {
  return Promise.resolve(extension);
});

ExtensionIPCEvent.instance.on(
  'runtime.command.launch',
  ({ extensionId }, options) => {
    if (typeof options.args !== 'undefined' && !isObject(options.args)) {
      throw new Error('"args" options type must be an object.');
    }

    return ExtensionService.instance
      .executeCommandAndWait({
        extensionId,
        launchContext: {
          args: options.args ?? {},
          launchBy: CommandLaunchBy.COMMAND,
        },
        commandId: options.name,
      })
      .catch((error) => {
        throw new ExtensionError(error);
      });
  },
);

ExtensionIPCEvent.instance.on(
  'runtime.command.launch',
  ({ extensionId }, options) => {
    if (typeof options.args !== 'undefined' && !isObject(options.args)) {
      throw new Error('"args" options type must be an object.');
    }

    return ExtensionService.instance
      .executeCommandAndWait({
        extensionId,
        launchContext: {
          args: options.args ?? {},
          launchBy: CommandLaunchBy.COMMAND,
        },
        commandId: options.name,
      })
      .catch((error) => {
        throw new ExtensionError(error);
      });
  },
);

ExtensionIPCEvent.instance.on(
  'runtime.command.updateDetail',
  async ({ extensionId, commandId }, { subtitle }) => {
    await DBService.instance.extension.updateCommand(extensionId, commandId, {
      customSubtitle: subtitle,
    });
  },
);
