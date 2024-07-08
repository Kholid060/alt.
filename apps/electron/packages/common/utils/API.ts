import { API as APIBase } from '@altdot/shared';

const API = new APIBase(import.meta.env.VITE_API_BASE_URL);

export default API;
