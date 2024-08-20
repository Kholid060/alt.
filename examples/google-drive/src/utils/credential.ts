import { _extension } from '@altdot/extension';

export const clientId =
  '479459643785-gbk8794fh1og5hho642h5578gmmjkvod.apps.googleusercontent.com';

export const credential = _extension.oAuth.createPKCE({
  client: {
    clientId,
    redirectMethod: _extension.OAuth.OAuthRedirect.AppUrl,
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'https://www.googleapis.com/auth/drive.metadata.readonly',
  },
  key: 'google-drive',
  icon: 'google-drive',
  name: 'Google Drive',
});
