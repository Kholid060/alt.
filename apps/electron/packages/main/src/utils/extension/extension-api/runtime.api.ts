import { onExtensionIPCEvent } from '../extension-api-event';
import DatabaseService from '/@/services/database.service';

onExtensionIPCEvent(
  'runtime.config.getValues',
  async ({ commandId, extensionId }, type = 'command') => {
    const configId =
      type === 'command' ? `${extensionId}:${commandId}` : extensionId;
    const configValues = await DatabaseService.getConfigs(configId);

    return configValues?.value ?? {};
  },
);
