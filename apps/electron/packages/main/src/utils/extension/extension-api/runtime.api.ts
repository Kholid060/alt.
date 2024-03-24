import { onExtensionIPCEvent } from '../extension-api-event';
import ExtensionsDBController from '/@/db/controller/extensions-db.controller';

onExtensionIPCEvent(
  'runtime.config.getValues',
  async ({ commandId, extension }, type = 'command') => {
    const configId =
      type === 'command' ? `${extension.id}:${commandId}` : extension.id;
    const configValues = await ExtensionsDBController.getConfigs(configId);

    return configValues?.value ?? {};
  },
);
