import { AppEnv } from '../validation/app-env.validation';

export const envConfig = (): Record<keyof AppEnv, unknown> => ({
  DEV: process.env.DEV,
  API_KEY: process.env.API_KEY,
  INITIAL_EXT_IDS: process.env.INITIAL_EXT_IDS,
  SECRET_DATA_KEY: process.env.SECRET_DATA_KEY,
  VITE_API_BASE_URL: process.env.VITE_API_BASE_URL,
  VITE_WEB_BASE_URL: process.env.VITE_WEB_BASE_URL,
  WS_ALLOWED_ORIGIN: process.env.WS_ALLOWED_ORIGIN,
  VITE_DEV_SERVER_URL: process.env.VITE_DEV_SERVER_URL,
});
