import { Injectable } from '@nestjs/common';
import { OnExtensionAPI } from '/@/common/decorators/extension.decorator';
import { ExtensionApiEvent } from '../events/extension-api.event';
import { CustomError } from '#packages/common/errors/custom-errors';
import { OAuthService } from '/@/oauth/oauth.service';
import { BrowserWindowService } from '/@/browser-window/browser-window.service';
import { ExtensionCredentialService } from '../../extension-credential/extension-credential.service';
import { ExtensionAuthTokenService } from '../../extension-auth-token/extension-auth-token.service';

@Injectable()
export class ExtensionOAuthApiListener {
  constructor(
    private oauthService: OAuthService,
    private browserWindow: BrowserWindowService,
    private authToken: ExtensionAuthTokenService,
    private extensionCredential: ExtensionCredentialService,
  ) {}

  @OnExtensionAPI('oauth.authorizationRequest')
  async authorizationRequest({
    args: [providerId],
    context: { extension, commandId, extensionId },
  }: ExtensionApiEvent<'oauth.authorizationRequest'>) {
    const credentialProvider = extension.credentials?.find(
      (credential) => credential.providerId === providerId,
    );
    if (!credentialProvider) {
      throw new CustomError("Couldn't find the credential");
    }

    const credential = await this.extensionCredential.getCredentialDetail({
      extensionId,
      providerId: credentialProvider.providerId,
    });
    if (!credential) return null;

    const windowCommand = await this.browserWindow.get('command');
    await windowCommand.toggleWindow(true);

    const continueOauth = await windowCommand.invoke(
      'command-window:show-oauth-overlay',
      credentialProvider,
      {
        commandId,
        extensionId,
        extensionTitle: extension.title,
        hasValue: Boolean(credential),
        credentialName: credential.name,
      },
    );
    if (!continueOauth) return null;

    const token = await this.oauthService.startAuth(credential.id, true);

    return {
      isExpired: false,
      scope: token.scope,
      expiresIn: token.expires_in,
      accessToken: token.access_token,
    };
  }

  @OnExtensionAPI('oauth.refreshAccessToken')
  async refreshAccessToken({
    args: [providerId],
    context: { extensionId },
  }: ExtensionApiEvent<'oauth.refreshAccessToken'>) {
    const token = await this.oauthService.refreshAccessToken(
      extensionId,
      providerId,
    );
    return {
      isExpired: false,
      scope: token.scope,
      expiresIn: token.expires_in,
      accessToken: token.access_token,
    };
  }

  @OnExtensionAPI('oauth.getTokens')
  async getTokens({
    args: [providerId],
    context: { extensionId },
  }: ExtensionApiEvent<'oauth.getTokens'>) {
    const token = await this.authToken.getTokenByCredential({
      providerId,
      extensionId,
    });
    if (!token) return null;

    const expiresIn = Math.max((token.expiresTimestamp - Date.now()) / 1000, 0);

    return {
      expiresIn,
      scope: token.scope ?? '',
      isExpired: expiresIn <= 1,
      accessToken: token.accessToken,
    };
  }

  @OnExtensionAPI('oauth.removeTokens')
  async removeTokens({
    args: [providerId],
    context: { extensionId },
  }: ExtensionApiEvent<'oauth.removeTokens'>) {
    await this.authToken.deleteTokenByCredential({
      providerId,
      extensionId,
    });
  }
}
