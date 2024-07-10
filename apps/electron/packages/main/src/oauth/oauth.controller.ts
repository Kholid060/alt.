import { Controller } from '@nestjs/common';

@Controller()
export class OAuthController {
  constructor() {}

  // @IPCInvoke('oauth:connect-account')
  // async connectAccount(
  //   @Payload() [credentialId]: IPCInvokePayload<'oauth:connect-account'>,
  // ): IPCInvokeReturn<'oauth:connect-account'> {
  //   await this.oauth.startAuth(credentialId);
  // }
}
