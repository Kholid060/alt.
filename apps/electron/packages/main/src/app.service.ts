import os from 'os';
import { app } from 'electron';
import { Injectable } from '@nestjs/common';
import { MessagePortChannelIds } from '#packages/common/interface/message-port-events.interface';
import { MESSAGE_PORT_CHANNEL_IDS } from '#packages/common/utils/constant/constant';
import { BrowserWindowService } from './browser-window/browser-window.service';
import { AppMessagePortBridgeOptions } from '#packages/common/interface/app.interface';

@Injectable()
export class AppService {
  constructor(private browserWindow: BrowserWindowService) {}

  getVersion() {
    return {
      $isError: false,
      app: app.getVersion(),
      os: `${process.platform}@${os.release()}`,
    };
  }

  async messagePortBridge(
    ports: Electron.MessagePortMain[],
    channelId: MessagePortChannelIds,
    _options?: AppMessagePortBridgeOptions,
  ) {
    if (ports.length === 0) return;

    switch (channelId) {
      case MESSAGE_PORT_CHANNEL_IDS.sharedWithCommand: {
        const windowCommand = await this.browserWindow.getOrCreate('command');
        windowCommand.postMessage('message-port:created', { channelId }, ports);
        break;
      }
    }
  }
}
