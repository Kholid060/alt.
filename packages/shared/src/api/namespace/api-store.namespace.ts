import {
  ApiStoreListExtensionsQuery,
  ApiExtensionStoreDetail,
  ApiExtensionStoreListItem,
} from '../../interfaces/api.interface';
import API from '../index';

class APIStoreNamespace {
  constructor(private api: API) {}

  listExtensions(options: ApiStoreListExtensionsQuery = {}) {
    const searhParams = new URLSearchParams();
    for (const key in options) {
      const value = options[key as keyof ApiStoreListExtensionsQuery];
      if (value) searhParams.set(key, value);
    }

    return this.api.authorizeFetch<{
      nextCursor: string;
      items: ApiExtensionStoreListItem[];
    }>(`/store/extensions?${searhParams.toString()}`, { isPublic: true });
  }

  getExtension(extensionId: string) {
    return this.api.authorizeFetch<ApiExtensionStoreDetail>(
      `/store/extensions/${extensionId}`,
      { isPublic: true },
    );
  }
}

export default APIStoreNamespace;
