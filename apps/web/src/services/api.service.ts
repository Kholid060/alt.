import { Session } from '@supabase/supabase-js';
import { UserProfile } from '@/interface/user.interface';
import { ARequestInit, FetchError, afetch } from '@/utils/afetch';
import {
  ExtensionCreatePayload,
  Extension,
  ExtensionUserListItem,
} from '@/interface/extension.interface';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class APIService {
  static instance = new APIService();

  private session: Session | null = null;

  constructor() {}

  static getErrorMessage(error: unknown) {
    if (error instanceof FetchError) {
      return error.data.message || error.data.error || error.statusText;
    }

    return 'Something went wrong!';
  }

  async authorizeFetch<T = unknown>(
    path: string,
    init: ARequestInit & { isPublic?: boolean } = {},
  ): Promise<T> {
    if (!this.session && !init?.isPublic) throw new Error('Unauthorized');

    return afetch<T>(`${API_BASE_URL}${path}`, {
      ...init,
      auth: this.session ? `Bearer ${this.session.access_token}` : undefined,
    });
  }

  $setSession(session: Session | null) {
    this.session = session;
  }

  $getSession() {
    return this.session;
  }

  getProfile() {
    return this.authorizeFetch<UserProfile | null>('/me');
  }

  updateProfile(profile: Partial<Pick<UserProfile, 'name' | 'username'>>) {
    return this.authorizeFetch<UserProfile>('/me', {
      method: 'PATCH',
      body: JSON.stringify(profile),
    });
  }

  createExtension(extensionPayload: ExtensionCreatePayload) {
    return this.authorizeFetch<{ extensionId: string }>('/me/extensions', {
      method: 'POST',
      body: JSON.stringify(extensionPayload),
    });
  }

  listMeExtensions() {
    return this.authorizeFetch<ExtensionUserListItem[]>('/me/extensions');
  }

  getMeExtension(id: string) {
    return this.authorizeFetch<Extension>(`/me/extensions/${id}`);
  }

  meExtensionExists(name: string) {
    return this.authorizeFetch<{ isExists: boolean }>(
      `/me/extensions?name=${name}`,
    ).then((result) => result.isExists);
  }
}

export default APIService;
