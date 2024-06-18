import { Session } from '@supabase/supabase-js';
import { ARequestInit, FetchError, afetch } from '@/utils/afetch';
import APIMeNamespace from './api/api-me.namespace';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class APIService {
  static instance = new APIService();

  static getErrorMessage(error: unknown, byStatus?: Record<number, string>) {
    if (!FetchError.isFetchError(error)) {
      return 'Something went wrong!';
    }

    if (byStatus && byStatus[error.status]) return byStatus[error.status];

    return error.data.message || error.data.error || error.statusText;
  }

  private session: Session | null = null;

  me = new APIMeNamespace(this);

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
}

export default APIService;
