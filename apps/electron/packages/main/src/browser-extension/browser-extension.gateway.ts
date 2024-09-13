import { APP_WEBSOCKET_PORT } from '@altdot/shared';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { BrowserExtensionService } from './browser-extension.service';
import { ConfigService } from '@nestjs/config';
import { AppEnv } from '../common/validation/app-env.validation';
import { browserInfoValidation } from './browser-extension.validation';
import {
  BrowserExtensionNamespace,
  BrowserExtensionSocket,
} from './browser-extension.interface';
import { debugLog } from '#packages/common/utils/helper';

@WebSocketGateway(APP_WEBSOCKET_PORT, {
  pingInterval: 20_000,
  namespace: '/extensions',
})
export class BrowserExtensionGateway
  implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect
{
  constructor(
    private config: ConfigService<AppEnv>,
    private browserExtension: BrowserExtensionService,
  ) {}

  afterInit(server: BrowserExtensionNamespace) {
    this.browserExtension.setSocket(server);
  }

  handleConnection(client: BrowserExtensionSocket) {
    const { auth, headers } = client.handshake;
    if (
      !headers.origin ||
      !this.config.get('WS_ALLOWED_ORIGIN').includes(headers.origin)
    ) {
      debugLog('WS Client not allowed', { auth, origin: headers.origin });
      client.disconnect();
      return;
    }

    const connectedBrowser = browserInfoValidation.safeParse(auth.browserInfo);
    if (!connectedBrowser.success) {
      client.disconnect();
      return;
    }

    client.data.browserInfo = connectedBrowser.data;
    this.browserExtension.addConnectedBrowser({
      ...connectedBrowser.data,
      socketId: client.id,
      lastAccessed: Date.now(),
    });
  }

  handleDisconnect(client: BrowserExtensionSocket) {
    this.browserExtension.removeConnectedBrowser(client.data.browserInfo.id);
  }

  @SubscribeMessage('browser:last-accessed')
  browserLastAccessed(
    @MessageBody()
    { browserId, lastAccessed }: { browserId: string; lastAccessed: number },
  ) {
    this.browserExtension.updateConnectedBrowser(browserId, { lastAccessed });
  }
}
