import { Notification } from 'electron';
import { onExtensionIPCEvent } from '../extension-api-event';
import ExtensionLoader from '../ExtensionLoader';

onExtensionIPCEvent(
  'notifications.create',
  ({ extension }, { title, body, subtitle, silent }) => {
    if (!Notification.isSupported()) return Promise.resolve(false);

    const notification = new Notification({
      body,
      title,
      silent,
      subtitle,
      icon:
        ExtensionLoader.instance.getPath(
          extension.id,
          'icon',
          extension.icon,
        ) ?? '',
    });
    notification.show();

    return Promise.resolve(true);
  },
);
