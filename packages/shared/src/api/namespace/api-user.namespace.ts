import {
  ApiExtensionStoreListItem,
  ApiUserData,
  ApiWorkflowStoreListItem,
} from '../../interfaces/api.interface';
import { searhParamsBuilder } from '../../utils/helper';
import API from '../index';

class APIUserNamespace {
  constructor(private api: API) {}

  get(username: string) {
    return this.api.authorizeFetch<ApiUserData>(`/users/${username}`);
  }

  listWorkflows(username: string, nextCursor?: string) {
    const searchParams = searhParamsBuilder({ nextCursor });

    return this.api.authorizeFetch<{
      nextCursor: string;
      items: ApiWorkflowStoreListItem[];
    }>(`/users/${username}/workflows?${searchParams.toString()}`);
  }

  listExtensions(username: string, nextCursor?: string) {
    const searchParams = searhParamsBuilder({ nextCursor });

    return this.api.authorizeFetch<{
      nextCursor: string;
      items: ApiExtensionStoreListItem[];
    }>(`/users/${username}/extensions?${searchParams.toString()}`);
  }
}

export default APIUserNamespace;
