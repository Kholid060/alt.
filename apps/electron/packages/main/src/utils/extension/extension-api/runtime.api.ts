import ExtensionIPCEvent from '../ExtensionIPCEvent';
import DBExtensionService from '../../../services/database/database-extension.service';

ExtensionIPCEvent.instance.on(
  'runtime.config.getValues',
  async ({ commandId, extensionId }, type = 'command') => {
    const configId =
      type === 'command' ? `${extensionId}:${commandId}` : extensionId;
    const configValues = await DBExtensionService.getConfigs(configId);

    return configValues?.value ?? {};
  },
);
