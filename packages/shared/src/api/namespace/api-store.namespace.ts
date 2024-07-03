import {
  ApiStoreListExtensionsQuery,
  ApiExtensionStoreDetail,
  ApiExtensionStoreListItem,
  ApiWorkflowStoreListItem,
  ApiWorkflowDetail,
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

  listWorkflows(options: ApiStoreListExtensionsQuery = {}) {
    const searhParams = new URLSearchParams();
    for (const key in options) {
      const value = options[key as keyof ApiStoreListExtensionsQuery];
      if (value) searhParams.set(key, value);
    }

    return this.api.authorizeFetch<{
      nextCursor: string;
      items: ApiWorkflowStoreListItem[];
    }>(`/store/workflows?${searhParams.toString()}`, { isPublic: true });
  }

  getExtension(extensionId: string) {
    return this.api.authorizeFetch<ApiExtensionStoreDetail>(
      `/store/extensions/${extensionId}`,
      { isPublic: true },
    );
  }

  getWorkflow(workflowId: string) {
    return this.api.authorizeFetch<ApiWorkflowDetail>(
      `/store/workflows/${workflowId}`,
      { isPublic: true },
    );
  }
}

export default APIStoreNamespace;
