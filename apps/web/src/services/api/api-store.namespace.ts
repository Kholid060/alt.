import {
  ExtensionCategories,
  ExtensionStoreDetail,
  ExtensionStoreListItem,
} from '@/interface/extension.interface';
import APIService from '../api.service';

export interface StoreQueryOptions {
  q: string;
  page: string;
  category: ExtensionCategories;
  sortBy: 'recently-added' | 'most-installed';
}

class APIStoreNamespace {
  constructor(private api: APIService) {}

  listExtensions(options: Partial<StoreQueryOptions> = {}) {
    const searhParams = new URLSearchParams();
    for (const key in options) {
      const value = options[key as keyof StoreQueryOptions];
      if (value) searhParams.set(key, value);
    }

    return this.api.authorizeFetch<{
      page: number;
      count: number;
      isLast: boolean;
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
