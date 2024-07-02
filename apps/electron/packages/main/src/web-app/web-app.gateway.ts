import { APP_WEBSOCKET_PORT } from '@alt-dot/shared';
import { ConfigService } from '@nestjs/config';
import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { AppEnv } from '../common/validation/app-env.validation';
import { Socket } from 'socket.io';
import { WebAppService } from './web-app.service';
import { WebAppNamespace } from './web-app.interface';

@WebSocketGateway(APP_WEBSOCKET_PORT, { namespace: '/web-app' })
export class WebAppGateway implements OnGatewayConnection, OnGatewayInit {
  constructor(
    private webApp: WebAppService,
    private config: ConfigService<AppEnv>,
  ) {}

  afterInit(server: WebAppNamespace) {
    this.webApp.setSocket(server);
  }

  handleConnection(client: Socket) {
    const { headers } = client.handshake;
    if (
      !headers.origin ||
      !this.config.get('WS_ALLOWED_ORIGIN').includes(headers.origin)
    ) {
      client.disconnect();
      return;
    }
  }

  @SubscribeMessage('workflows:list')
  listWorkflows() {
    return this.webApp.listWorkflows();
  }

  @SubscribeMessage('workflows:get')
  getWorkflow(@MessageBody() workflowId: string) {
    return this.webApp.getWorkflow(workflowId);
  }
}
