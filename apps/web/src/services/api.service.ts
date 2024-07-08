import { API } from '@altdot/shared';

class APIService extends API {
  static instance = new APIService();

  constructor() {
    super(import.meta.env.VITE_API_BASE_URL);
  }
}

export default APIService;
