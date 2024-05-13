import ExtensionIPCEvent from '../ExtensionIPCEvent';
import DBService from '/@/services/database/database.service';

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
