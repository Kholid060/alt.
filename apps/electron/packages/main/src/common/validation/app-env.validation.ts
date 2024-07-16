import { z } from 'zod';

export const appEnvSchema = z.object({
  API_KEY: z.string().min(1),
  DEV: z.boolean().optional(),
  SECRET_DATA_KEY: z.string().min(32),
  VITE_DEV_SERVER_URL: z.string().optional(),
  VITE_WEB_BASE_URL: z.string().url().min(1),
  VITE_API_BASE_URL: z.string().url().min(1),
  WS_ALLOWED_ORIGIN: z
    .string()
    .min(1)
    .transform((value) => value.split(',').map((str) => str.trim())),
});
export type AppEnv = z.infer<typeof appEnvSchema>;
