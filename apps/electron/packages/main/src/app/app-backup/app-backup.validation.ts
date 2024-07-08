import { EXTENSION_COMMAND_TYPE } from '@altdot/shared';
import { z } from 'zod';
import { workflowFileValidation } from '/@/workflow/workflow.validation';

export const extensionCommandBackupValidation = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  extensionId: z.string(),
  isDisabled: z.boolean(),
  path: z.string().nullable(),
  alias: z.string().nullable(),
  shortcut: z.string().nullable(),
  isFallback: z.boolean().nullable(),
  type: z.enum(EXTENSION_COMMAND_TYPE),
});
export type ExtensionCommandBackupValidation = z.infer<
  typeof extensionCommandBackupValidation
>;

export const appBackupFileValidation = z.object({
  workflows: workflowFileValidation
    .merge(z.object({ id: z.string() }))
    .array()
    .optional(),
  extensions: z
    .object({
      id: z.string(),
      isDisabled: z.boolean(),
      commands: extensionCommandBackupValidation.array(),
    })
    .array()
    .optional(),
  settings: z.object({
    startup: z.boolean(),
    upsertRestoreDuplicate: z.boolean(),
    clearStateAfter: z.number().max(90).min(1),
  }),
});
export type AppBackupFile = z.infer<typeof appBackupFileValidation>;
