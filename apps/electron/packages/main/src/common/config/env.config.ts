export const envConfig = () => ({
  API_KEY: process.env.API_KEY,
  SECRET_DATA_KEY: process.env.SECRET_DATA_KEY,
  VITE_API_BASE_URL: process.env.VITE_API_BASE_URL,
  VITE_WEB_BASE_URL: process.env.VITE_WEB_BASE_URL,
  WS_ALLOWED_ORIGIN: process.env.WS_ALLOWED_ORIGIN,
});
