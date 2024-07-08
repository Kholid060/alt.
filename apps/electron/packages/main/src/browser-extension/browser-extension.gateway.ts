import { APP_WEBSOCKET_PORT } from '@altdot/shared';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
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

@WebSocketGateway(APP_WEBSOCKET_PORT, { namespace: '/extensions' })
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
    });
  }

  handleDisconnect(client: BrowserExtensionSocket) {
    this.browserExtension.removeConnectedBrowser(client.data.browserInfo.id);
  }
}
