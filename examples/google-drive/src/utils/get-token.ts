import type { _extension } from '@altdot/extension';
import { clientId, credential } from './credential';

async function refreshToken(
  refreshToken: string,
): Promise<_extension.OAuth.OAuthTokenStorageValue> {
  const searchParams = new URLSearchParams();
  searchParams.set('client_id', clientId);
  searchParams.set('refresh_token', refreshToken);
  searchParams.set('grant_type', 'refresh_token');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: searchParams,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  const body = await response.json();
  await credential.setToken(body);

  return body;
}

export async function getToken(): Promise<_extension.OAuth.OAuthTokenStorageValue> {
  let token = await credential.getToken();
  if (token) {
    if (Date.now() >= token.expiresTimestamp) {
      return refreshToken(token.refreshToken);
    }

    return token;
  }

  const request = await credential.startAuth();
  if (!request) throw new Error('Missing request');

  const searchParams = new URLSearchParams();
  searchParams.set('code', request.code);
  searchParams.set('client_id', clientId);
  searchParams.set('grant_type', 'authorization_code');
  searchParams.set('redirect_uri', request.redirectUri);
  searchParams.set('code_verifier', request.codeVerifier);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: searchParams,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  const body: _extension.OAuth.OAuthTokenResponse = await response.json();
  await credential.setToken(body);

  token = await credential.getToken();

  return token;
}
