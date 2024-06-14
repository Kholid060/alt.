import { Session } from '@supabase/supabase-js';
import { UserProfile } from '@/interface/user.interface';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ApiErrorData {
  error: string;
  message: string;
  statusCode: number;
}

export class APIError extends Error {
  status: number;
  data: ApiErrorData;
  statusText: string;

  constructor({
    data,
    status,
    message,
    statusText,
  }: {
    status: number;
    message: string;
    statusText: string;
    data: ApiErrorData;
  }) {
    super(message);
    this.data = data;
    this.status = status;
    this.statusText = statusText;
  }
}

class APIService {
  static instance = new APIService();

  private session: Session | null = null;

  constructor() {}

  static getErrorMessage(error: unknown) {
    if (error instanceof APIError) {
      return error.data.message || error.data.error || error.statusText;
    }

    return 'Something went wrong!';
  }

  async authroizeFetch<T = unknown>(
    path: string,
    init?: RequestInit,
  ): Promise<T> {
    if (!this.session) throw new Error('Unauthorized');

    const request = new Request(`${API_BASE_URL}${path}`, init);
    request.headers.set('Authorization', `Bearer ${this.session.access_token}`);

    if (init && init.method !== 'GET' && !(init.body instanceof FormData)) {
      request.headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(request);
    const body = await response.json();

    if (!response.ok)
      throw new APIError({
        data: body,
        message: 'Error',
        status: response.status,
        statusText: response.statusText,
      });

    return body;
  }

  setSession(session: Session | null) {
    this.session = session;
  }

  getProfile() {
    return this.authroizeFetch<UserProfile | null>('/me');
  }

  updateProfile(profile: Partial<Pick<UserProfile, 'name' | 'username'>>) {
    return this.authroizeFetch<UserProfile>('/me', {
      method: 'PATCH',
      body: JSON.stringify(profile),
    });
  }
}

export default APIService;
