import {
  ApiUserProfile,
  ApiExtensionEntry,
  APISuccessResult,
  ApiExtensionUserDetail,
  ApiExtensionUserListItem,
  ApiExtensionCreatePayload,
  ApiWorkflowUserInsertPayload,
  ApiWorkflowUserUpdatePayload,
  ApiWorkflowUserListItem,
  ApiWorkflowDetail,
} from '../../interfaces/api.interface';
import API from '../index';

class APIMeNamespace {
  constructor(private api: API) {}

  get() {
    return this.api.authorizeFetch<ApiUserProfile | null>('/me');
  }

  update(profile: Partial<Pick<ApiUserProfile, 'name' | 'username'>>) {
    return this.api.authorizeFetch<ApiUserProfile>('/me', {
      method: 'PATCH',
      body: JSON.stringify(profile),
    });
  }

  createWorkflow(payload: ApiWorkflowUserInsertPayload) {
    return this.api.authorizeFetch<APISuccessResult<{ workflowId: string }>>(
      '/me/workflows',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  }

  updateWorkflow(workflowId: string, payload: ApiWorkflowUserUpdatePayload) {
    return this.api.authorizeFetch<APISuccessResult<{ workflowId: string }>>(
      `/me/workflows/${workflowId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    );
  }

  deleteWorkflow(workflowId: string) {
    return this.api.authorizeFetch<APISuccessResult<{ workflowId: string }>>(
      `/me/workflows/${workflowId}`,
      {
        method: 'DELETE',
      },
    );
  }

  getWorkflow(workflowId: string) {
    return this.api.authorizeFetch<ApiWorkflowDetail>(
      `/me/workflows/${workflowId}`,
    );
  }

  listWorkflows() {
    return this.api.authorizeFetch<ApiWorkflowUserListItem[]>('/me/workflows');
  }

  createExtension(extensionPayload: ApiExtensionCreatePayload) {
    return this.api.authorizeFetch<APISuccessResult<{ extensionId: string }>>(
      '/me/extensions',
      {
        method: 'POST',
        body: JSON.stringify(extensionPayload),
      },
    );
  }

  createEntry(extensionId: string, reason: string) {
    return this.api.authorizeFetch<
      APISuccessResult<{ data: ApiExtensionEntry }>
    >(`/me/extensions/${extensionId}/entry`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  listExtensions() {
    return this.api.authorizeFetch<ApiExtensionUserListItem[]>(
      '/me/extensions',
    );
  }

  getExtension(id: string) {
    return this.api.authorizeFetch<ApiExtensionUserDetail>(
      `/me/extensions/${id}`,
    );
  }

  deleteExtensionEntry(extensionId: string) {
    return this.api.authorizeFetch<APISuccessResult<null>>(
      `/me/extensions/${extensionId}/entry`,
      { method: 'DELETE' },
    );
  }

  deleteExtension(extensionId: string) {
    return this.api.authorizeFetch<APISuccessResult<null>>(
      `/me/extensions/${extensionId}`,
      { method: 'DELETE' },
    );
  }

  resubmitEntry(extensionId: string) {
    return this.api.authorizeFetch<APISuccessResult<ApiExtensionEntry>>(
      `/me/extensions/${extensionId}/entry/resubmit`,
      { method: 'POST' },
    );
  }

  async extensionExists(name: string) {
    const result = await this.api.authorizeFetch<{
      isExists: boolean;
    }>(`/me/extensions/exists?name=${name}`);

    return result.isExists;
  }
}

export default APIMeNamespace;
