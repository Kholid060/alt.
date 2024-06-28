import { Controller } from '@nestjs/common';
import { OAuthService } from './oauth.service';
import { IPCInvoke } from '../common/decorators/ipc.decorator';
import type {
  IPCInvokePayload,
  IPCInvokeReturn,
} from '#packages/common/interface/ipc-events.interface';
import { Payload } from '@nestjs/microservices';

@Controller()
export class OAuthController {
  constructor(private oauth: OAuthService) {}

  @IPCInvoke('oauth:connect-account')
  async connectAccount(
    @Payload() [credentialId]: IPCInvokePayload<'oauth:connect-account'>,
  ): IPCInvokeReturn<'oauth:connect-account'> {
    await this.oauth.startAuth(credentialId);
  }
}
