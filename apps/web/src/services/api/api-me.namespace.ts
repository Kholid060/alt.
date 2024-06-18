import {
  ExtensionCreatePayload,
  ExtensionUserListItem,
  ExtensionUserDetail,
  ExtensionEntry,
} from '@/interface/extension.interface';
import { UserProfile } from '@/interface/user.interface';
import APIService from '../api.service';
import { APISuccessResult } from '@/interface/api.interface';

class APIMeNamespace {
  constructor(private api: APIService) {}

  get() {
    return this.api.authorizeFetch<UserProfile | null>('/me');
  }

  update(profile: Partial<Pick<UserProfile, 'name' | 'username'>>) {
    return this.api.authorizeFetch<UserProfile>('/me', {
      method: 'PATCH',
      body: JSON.stringify(profile),
    });
  }

  createExtension(extensionPayload: ExtensionCreatePayload) {
    return this.api.authorizeFetch<APISuccessResult<{ extensionId: string }>>(
      '/me/extensions',
      {
        method: 'POST',
        body: JSON.stringify(extensionPayload),
      },
    );
  }

  createEntry(extensionId: string, reason: string) {
    return this.api.authorizeFetch<APISuccessResult<{ data: ExtensionEntry }>>(
      `/me/extensions/${extensionId}/entry`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      },
    );
  }

  listExtensions() {
    return this.api.authorizeFetch<ExtensionUserListItem[]>('/me/extensions');
  }

  getExtension(id: string) {
    return this.api.authorizeFetch<ExtensionUserDetail>(`/me/extensions/${id}`);
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
    return this.api.authorizeFetch<APISuccessResult<ExtensionEntry>>(
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
