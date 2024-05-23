import { CommandLaunchBy } from '@repo/extension';
import ExtensionIPCEvent from '../ExtensionIPCEvent';
import DBService from '/@/services/database/database.service';
import ExtensionService from '/@/services/extension.service';
import { isObject } from '@repo/shared';
import { ExtensionError } from '#packages/common/errors/custom-errors';

ExtensionIPCEvent.instance.on(
  'runtime.config.getValues',
  async ({ commandId, extensionId }, type = 'command') => {
    const configId =
      type === 'command' ? `${extensionId}:${commandId}` : extensionId;
    const configValues =
      await DBService.instance.extension.getConfigValue(configId);

    return configValues?.value ?? {};
  },
);

ExtensionIPCEvent.instance.on('runtime.getManifest', ({ extension }) => {
  return Promise.resolve(extension);
});

ExtensionIPCEvent.instance.on(
  'runtime.launchCommand',
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
