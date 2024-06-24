import API from '../index';

class APIExtensionsNamespace {
  private apiKey: string = '';

  constructor(private api: API) {}

  $setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  getDownloadExtensionUrl(extensionId: string) {
    return this.api.authorizeFetch<{ downloadUrl: string }>(
      `/extensions/${extensionId}/download`,
      { authToken: this.apiKey },
    );
  }
}

export default APIExtensionsNamespace;
