import { SupabaseClient, createClient } from '@supabase/supabase-js';

class SupabaseService {
  private static _instance: SupabaseService;
  static get instance() {
    return this._instance || (this._instance = new SupabaseService());
  }

  readonly client: SupabaseClient;
  
  constructor() {
    this.client = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLIC_KEY);
  }

  getSession() {
    return this.client.auth.getSession();
  }
}

export default SupabaseService;
