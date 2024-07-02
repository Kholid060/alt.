import { BrowserInfo, BrowserType } from '@alt-dot/shared';
import { z } from 'zod';

const BROWSER_TYPE = [
  'edge',
  'chrome',
  'firefox',
] as const satisfies BrowserType[];

export const browserInfoValidation = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  type: z.enum(BROWSER_TYPE),
}) satisfies z.ZodType<BrowserInfo>;
