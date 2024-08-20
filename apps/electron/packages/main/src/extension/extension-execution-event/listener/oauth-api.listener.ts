import { Injectable } from '@nestjs/common';
import { OnExtensionAPI } from '/@/common/decorators/extension.decorator';
import { ExtensionApiEvent } from '../events/extension-api.event';
import { OAuthService } from '/@/oauth/oauth.service';
import type { ExtensionExecutionEventReturn } from '../extension-execution-event.interface';
import { ExtensionOAuthTokensService } from '../../extension-oauth-tokens/extension-oauth-tokens.service';

@Injectable()
export class ExtensionOAuthApiListener {
  constructor(
    private oauthService: OAuthService,
    private oauthTokenService: ExtensionOAuthTokensService,
  ) {}

  @OnExtensionAPI('oAuth.startAuth')
  startAuth({
    args: [provider],
    context: { extension, extensionId },
  }: ExtensionApiEvent<'oAuth.startAuth'>): ExtensionExecutionEventReturn<'oAuth.startAuth'> {
    return this.oauthService.startAuthOverlay(provider, {
      id: extensionId,
      icon: extension.icon,
      title: extension.title,
    });
  }

  @OnExtensionAPI('oAuth.getToken')
  async getToken({
    args: [provider],
    context: { extensionId },
  }: ExtensionApiEvent<'oAuth.getToken'>): ExtensionExecutionEventReturn<'oAuth.getToken'> {
    return this.oauthService.getExtensionToken(extensionId, provider);
  }

  @OnExtensionAPI('oAuth.removeToken')
  async removeToken({
    args: [provider],
    context: { extensionId },
  }: ExtensionApiEvent<'oAuth.removeToken'>): ExtensionExecutionEventReturn<'oAuth.removeToken'> {
    await this.oauthTokenService.remove({
      extensionId,
      key: provider.key,
      clientId: provider.client.clientId,
    });
  }

  @OnExtensionAPI('oAuth.setToken')
  setToken({
    args: [provider, payload],
    context: { extensionId },
  }: ExtensionApiEvent<'oAuth.setToken'>): ExtensionExecutionEventReturn<'oAuth.setToken'> {
    return this.oauthService.setExtensionToken(
      { ...provider, extensionId },
      payload,
    );
  }

  // @OnExtensionAPI('oAuth.authorizationRequest')
  // async authorizationRequest({
  //   args: [providerId],
  //   context: { extension, commandId, extensionId },
  // }: ExtensionApiEvent<'oAuth.authorizationRequest'>) {
  //   const credentialProvider = extension.credentials?.find(
  //     (credential) => credential.providerId === providerId,
  //   );
  //   if (!credentialProvider) {
  //     throw new CustomError("Couldn't find the credential");
  //   }

  //   const credential = await this.extensionCredential.getCredentialDetail({
  //     extensionId,
  //     providerId: credentialProvider.providerId,
  //   });
  //   if (!credential) return null;

  //   const windowCommand = await this.browserWindow.get('command');
  //   await windowCommand.toggleWindow(true);

  //   const continueOauth = await windowCommand.invoke(
  //     'command-window:show-oauth-overlay',
  //     credentialProvider,
  //     {
  //       commandId,
  //       extensionId,
  //       extensionTitle: extension.title,
  //       hasValue: Boolean(credential),
  //       credentialName: credential.name,
  //     },
  //   );
  //   if (!continueOauth) return null;

  //   const token = await this.oauthService.startAuth(credential.id, true);

  //   return {
  //     isExpired: false,
  //     scope: token.scope,
  //     expiresIn: token.expires_in,
  //     accessToken: token.access_token,
  //   };
  // }

  // @OnExtensionAPI('oAuth.refreshAccessToken')
  // async refreshAccessToken({
  //   args: [providerId],
  //   context: { extensionId },
  // }: ExtensionApiEvent<'oAuth.refreshAccessToken'>) {
  //   const token = await this.oauthService.refreshAccessToken(
  //     extensionId,
  //     providerId,
  //   );
  //   return {
  //     isExpired: false,
  //     scope: token.scope,
  //     expiresIn: token.expires_in,
  //     accessToken: token.access_token,
  //   };
  // }

  // @OnExtensionAPI('oAuth.getTokens')
  // async getTokens({
  //   args: [providerId],
  //   context: { extensionId },
  // }: ExtensionApiEvent<'oAuth.getTokens'>) {
  //   const token = await this.authToken.getTokenByCredential({
  //     providerId,
  //     extensionId,
  //   });
  //   if (!token) return null;

  //   const expiresIn = Math.max((token.expiresTimestamp - Date.now()) / 1000, 0);

  //   return {
  //     expiresIn,
  //     scope: token.scope ?? '',
  //     isExpired: expiresIn <= 1,
  //     accessToken: token.accessToken,
  //   };
  // }

  // @OnExtensionAPI('oAuth.removeTokens')
  // async removeTokens({
  //   args: [providerId],
  //   context: { extensionId },
  // }: ExtensionApiEvent<'oAuth.removeTokens'>) {
  //   await this.authToken.deleteTokenByCredential({
  //     providerId,
  //     extensionId,
  //   });
  // }
}
