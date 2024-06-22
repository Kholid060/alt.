import {
  ExtensionStoreDetail,
  ExtensionStoreListItem,
} from '@/interface/extension.interface';
import APIService from '../api.service';
import { StoreQueryValidation } from '@/validation/store-query.validation';

class APIStoreNamespace {
  constructor(private api: APIService) {}

  listExtensions(
    options: Partial<StoreQueryValidation & { nextCursor?: string }> = {},
  ) {
    const searhParams = new URLSearchParams();
    for (const key in options) {
      const value = options[key as keyof StoreQueryValidation];
      if (value) searhParams.set(key, value);
    }

    return this.api.authorizeFetch<{
      nextCursor: string;
      items: ExtensionStoreListItem[];
    }>(`/store/extensions?${searhParams.toString()}`, { isPublic: true });
  }

  getExtension(extensionId: string) {
    return this.api.authorizeFetch<ExtensionStoreDetail>(
      `/store/extensions/${extensionId}`,
      { isPublic: true },
    );
  }
}

export default APIStoreNamespace;
