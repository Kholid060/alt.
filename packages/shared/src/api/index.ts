import { ARequestInit, FetchError, afetch } from '../utils/afetch';
import APIMeNamespace from './namespace/api-me.namespace';
import APIStoreNamespace from './namespace/api-store.namespace';
import APIAdminNamespace from './namespace/api-admin.namespace';
import APIExtensionsNamespace from './namespace/api-extensions.namespace-';
import APIWorkflowsNamespace from './namespace/api-workflows.namespace';
import APIUserNamespace from './namespace/api-user.namespace';

class API {
  static getErrorMessage(error: unknown, byStatus?: Record<number, string>) {
    if (!FetchError.isFetchError(error)) {
      return 'Something went wrong!';
    }

    if (byStatus && byStatus[error.status]) return byStatus[error.status];

    return error.data.message || error.data.error || error.statusText;
  }

  static async handleError<T, P>(
    func: () => Promise<T>,
    handler: Record<number, (error: FetchError) => P>,
  ): Promise<T | P> {
    try {
      return await func();
    } catch (error) {
      if (FetchError.isFetchError(error) && handler[error.status]) {
        return handler[error.status](error);
      }

      throw error;
    }
  }

  private accessToken: string | null = null;

  handleError: typeof API.handleError = API.handleError;
  getErrorMessage: typeof API.getErrorMessage = API.getErrorMessage;

  me = new APIMeNamespace(this);
  user = new APIUserNamespace(this);
  store = new APIStoreNamespace(this);
  admin = new APIAdminNamespace(this);
  workflows = new APIWorkflowsNamespace(this);
  extensions = new APIExtensionsNamespace(this);

  constructor(
    readonly apiBaseURL: string,
    readonly apiKey?: string,
  ) {}

  async authorizeFetch<T = unknown>(
    path: string,
    init: ARequestInit & { isPublic?: boolean; authToken?: string } = {},
  ): Promise<T> {
    if (!this.accessToken && !init?.isPublic && !init.authToken) {
      throw new Error('Unauthorized');
    }

    const token = init.authToken ?? this.accessToken;
    return afetch<T>(`${this.apiBaseURL}${path}`, {
      ...init,
      auth: token ? `Bearer ${token}` : undefined,
    });
  }

  $setAccessToken(session: string | null) {
    this.accessToken = session;
  }

  $getAccessToken() {
    return this.accessToken;
  }
}

export default API;
