import { Notification } from 'electron';
import { onExtensionIPCEvent } from '../extension-api-event';

onExtensionIPCEvent(
  'notifications.create',
  (_, { title, body, subtitle, silent }) => {
    if (!Notification.isSupported()) return Promise.resolve(false);

    const notification = new Notification({
      body,
      title,
      silent,
      subtitle,
    });
    notification.show();

    return Promise.resolve(true);
  },
);
