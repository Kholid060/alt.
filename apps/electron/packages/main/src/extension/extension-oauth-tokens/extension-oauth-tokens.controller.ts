import { Controller } from '@nestjs/common';
import { ExtensionOAuthTokensService } from './extension-oauth-tokens.service';
import { IPCInvoke } from '/@/common/decorators/ipc.decorator';
import type {
  IPCInvokePayload,
  IPCInvokeReturn,
} from '#packages/common/interface/ipc-events.interface';
import { Payload } from '@nestjs/microservices';

@Controller()
export class ExtensionOAuthTokensController {
  constructor(private oauthTokens: ExtensionOAuthTokensService) {}

  @IPCInvoke('database:get-oauth-tokens-account-list')
  getAccounts(): IPCInvokeReturn<'database:get-oauth-tokens-account-list'> {
    return this.oauthTokens.listAccounts();
  }

  @IPCInvoke('database:delete-extension-oauth-token')
  async deleteToken(
    @Payload() [id]: IPCInvokePayload<'database:delete-extension-oauth-token'>,
  ): IPCInvokeReturn<'database:delete-extension-oauth-token'> {
    await this.oauthTokens.remove(id);
  }
}
