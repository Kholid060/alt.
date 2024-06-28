import { Injectable } from '@nestjs/common';
import { ExtensionApiEvent } from '../events/extension-api.event';
import { OnExtensionAPI } from '/@/common/decorators/extension.decorator';
import { Notification } from 'electron';

@Injectable()
export class ExtensionNotificationApiListener {
  constructor() {}

  @OnExtensionAPI('notifications.create')
  create({
    args: [{ title, body, subtitle, silent }],
  }: ExtensionApiEvent<'notifications.create'>) {
    if (!Notification.isSupported()) return Promise.resolve(false);

    const notification = new Notification({
      body,
      title,
      silent,
      subtitle,
    });
    notification.show();

    return Promise.resolve(true);
  }
}
