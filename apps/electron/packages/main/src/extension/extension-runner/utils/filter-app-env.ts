import { appEnvSchema } from '/@/common/validation/app-env.validation';

export function filterAppEnv() {
  const filteredEnv = Object.fromEntries(
    Object.keys(appEnvSchema.shape).map((key) => [key, '']),
  );
  return { ...process.env, ...filteredEnv };
}
