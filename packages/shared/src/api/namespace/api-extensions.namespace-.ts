import { ApiExtensionHighlightItem } from '../../interfaces/api.interface';
import API from '../index';

class APIExtensionsNamespace {
  private apiKey: string = '';

  constructor(private api: API) {
    this.apiKey = api.apiKey ?? '';
  }

  $setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  getDownloadFileUrl(extensionId: string) {
    return this.api.authorizeFetch<{ downloadUrl: string }>(
      `/extensions/${extensionId}/download`,
      { authToken: this.apiKey },
    );
  }

  checkUpdate(extensions: { extensionId: string; version: string }[]) {
    return this.api.authorizeFetch<
      { id: string; fileUrl: string; version: string; apiVersion: string }[]
    >('/extensions/check-update', {
      method: 'POST',
      authToken: this.apiKey,
      body: JSON.stringify(extensions),
    });
  }

  getHighlights(ids: string[]) {
    return this.api.authorizeFetch<ApiExtensionHighlightItem[]>(
      `/extensions/highlights?ids=${ids.join(',')}`,
      {
        authToken: this.apiKey,
      },
    );
  }
}

export default APIExtensionsNamespace;
