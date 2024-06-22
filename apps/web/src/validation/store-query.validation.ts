import { EXTENSION_CATEGORIES } from '@alt-dot/extension-core';
import { z } from 'zod';

export const storeQueryValidation = z.object({
  q: z.string().optional(),
  category: z.enum(EXTENSION_CATEGORIES).optional(),
  sortBy: z
    .enum(['recently-added', 'most-installed'])
    .default('most-installed'),
});
export type StoreQueryValidation = z.infer<typeof storeQueryValidation>;
