import { z } from 'zod';

export const BrowserInfoValidation = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
});

export type BrowserInfo = z.infer<typeof BrowserInfoValidation>;
