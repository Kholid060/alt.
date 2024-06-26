import {
  APP_WEBSOCKET_PORT,
  BrowserConnected,
  BrowserInfo,
  BrowserType,
  ExtensionSocketData,
  ExtensionWSClientToServerEvents,
  ExtensionWSInterServerEvents,
  ExtensionWSServerToClientEvents,
} from '@alt-dot/shared';
import type { Namespace, Socket } from 'socket.io';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
} from '@nestjs/websockets';
import { BrowserExtensionService } from './browser-extension.service';
import { z } from 'zod';

const BROWSER_EMIT_TIMEOUT_MS = 60_000;
const BROWSER_TYPE = [
  'edge',
  'chrome',
  'firefox',
] as const satisfies BrowserType[];

const BrowserInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  type: z.enum(BROWSER_TYPE),
}) satisfies z.ZodType<BrowserInfo>;

type BrowserExtensionSocket = Socket<
  ExtensionWSClientToServerEvents,
  ExtensionWSServerToClientEvents,
  ExtensionWSInterServerEvents,
  ExtensionSocketData
>;

export type ExtensionNamespace = Namespace<
  ExtensionWSClientToServerEvents,
  ExtensionWSServerToClientEvents,
  ExtensionWSInterServerEvents,
  ExtensionSocketData
>;

export type ExtensionConnectedBrowser = BrowserConnected & { socketId: string };

@WebSocketGateway(APP_WEBSOCKET_PORT, { namespace: '/extensions' })
export class BrowserExtensionGateway
  implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect
{
  constructor(private browserExtension: BrowserExtensionService) {}

  afterInit(server: ExtensionNamespace) {
    this.browserExtension.setSocket(server);
  }

  handleConnection(client: BrowserExtensionSocket) {
    // @ts-expect-error to save some memory
    client.request = null;

    const connectedBrowser = BrowserInfoSchema.safeParse(
      client.handshake.auth.browserInfo,
    );
    if (!connectedBrowser.success) {
      client.disconnect();
      return;
    }

    client.data.browserInfo = connectedBrowser.data;
    this.browserExtension.addConnectedBrowser(connectedBrowser.data);
  }

  handleDisconnect(client: BrowserExtensionSocket) {
    this.browserExtension.removeConnectedBrowser(client.data.browserInfo.id);
  }
}
