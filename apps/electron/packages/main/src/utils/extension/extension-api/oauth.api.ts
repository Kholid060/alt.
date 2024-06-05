import { ExtensionError } from '#packages/common/errors/custom-errors';
import ExtensionIPCEvent from '../ExtensionIPCEvent';
import IPCMain from '../../ipc/IPCMain';
import DBService from '/@/services/database/database.service';
import OauthService from '/@/services/oauth.service';
import WindowCommand from '/@/window/command-window';

ExtensionIPCEvent.instance.on(
  'oauth.authorizationRequest',
  async ({ extension, commandId, extensionId }, providerId) => {
    const credentialProvider = extension.credentials?.find(
      (credential) => credential.providerId === providerId,
    );
    if (!credentialProvider) {
      throw new ExtensionError(
        `Couldn't find credential with "${providerId}" providerId`,
      );
    }

    const credentialValue =
      await DBService.instance.extension.getCredentialValue({
        extensionId,
        providerId: credentialProvider.providerId,
      });
    if (!credentialValue) return null;

    WindowCommand.instance.toggleWindow(true);

    const continueOauth = await IPCMain.instance.invoke(
      'command',
      'command-window:show-oauth-overlay',
      credentialProvider,
      {
        commandId,
        extensionId,
        extensionTitle: extension.title,
        hasValue: Boolean(credentialValue),
        credentialName: credentialValue.name,
      },
    );
    if (!continueOauth) return null;

    const token = await OauthService.instance.startAuth(
      credentialValue.id,
      true,
    );

    return {
      isExpired: false,
      scope: token.scope,
      expiresIn: token.expires_in,
      accessToken: token.access_token,
    };
  },
);

ExtensionIPCEvent.instance.on(
  'oauth.refreshAccessToken',
  async ({ extensionId }, providerId) => {
    const token = await OauthService.instance.refreshAccessToken(
      extensionId,
      providerId,
    );
    return {
      isExpired: false,
      scope: token.scope,
      expiresIn: token.expires_in,
      tokenType: token.token_type,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
    };
  },
);

ExtensionIPCEvent.instance.on(
  'oauth.getTokens',
  async ({ extensionId }, providerId) => {
    const token =
      await DBService.instance.extension.getCredentialValueWithToken({
        extensionId,
        providerId,
      });
    if (!token) return null;

    const expiresIn = Math.max(
      (token.oauthToken.expiresTimestamp - Date.now()) / 1000,
      0,
    );

    return {
      expiresIn,
      isExpired: expiresIn <= 1,
      scope: token.oauthToken.scope ?? '',
      accessToken: token.oauthToken.accessToken,
    };
  },
);

ExtensionIPCEvent.instance.on(
  'oauth.removeTokens',
  ({ extensionId }, providerId) => {
    return DBService.instance.extension.deleteCredentialOAuthToken({
      extensionId,
      providerId,
    });
  },
);