import ExtensionIPCEvent from '../ExtensionIPCEvent';
import DatabaseService from '/@/services/database.service';

ExtensionIPCEvent.instance.on(
  'runtime.config.getValues',
  async ({ commandId, extensionId }, type = 'command') => {
    const configId =
      type === 'command' ? `${extensionId}:${commandId}` : extensionId;
    const configValues = await DatabaseService.getConfigs(configId);

    return configValues?.value ?? {};
  },
);
