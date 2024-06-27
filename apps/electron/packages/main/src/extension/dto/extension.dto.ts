import { z } from 'zod';
import { NewExtension, extensions } from '/@/db/schema/extension.schema';
import { createInsertSchema } from 'drizzle-zod';
import { ExtensionManifestSchema } from '@alt-dot/extension-core';

const extensionSchema = createInsertSchema(extensions).merge(
  ExtensionManifestSchema.pick({
    config: true,
    permissions: true,
    credentials: true,
  }),
);

export const createExtensionSchema = extensionSchema;
export type CreateExtensionDto = NewExtension;

export const updateExtensionSchema = extensionSchema
  .partial()
  .omit({ id: true });
export type UpdateExtensionDto = z.infer<typeof updateExtensionSchema>;

export interface ListExtensionFilterDto {
  activeOnly?: boolean;
  excludeBuiltIn?: boolean;
}
