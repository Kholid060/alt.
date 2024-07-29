import { z } from 'zod';
import { ExtensionCredentialSchema } from './manifest-credential';
import {
  EXTENSION_CATEGORIES,
  EXTENSION_CONFIG_TYPE,
  EXTENSION_PERMISSIONS,
  EXTENSION_COMMAND_TYPE,
  EXTENSION_COMMAND_ARGUMENT_TYPE,
  ExtensionConfigType,
  ExtensionPermissions,
  ExtensionCommandType,
  ExtensionCommandArgumentType,
} from '@altdot/shared';
import type { UiIcons } from '@altdot/ui/dist/components/ui/icons';

const URL_FRIENDLY_REGEX = /^[a-zA-Z0-9_-]*$/;

const iconSchema = z.custom<
  `icon:${keyof typeof UiIcons}` | (string & Record<never, never>)
>((value) => typeof value === 'string' && value.length >= 1);

const ExtensionCommandArgumentBaseSchema = z.object({
  name: z.string().min(1).max(32),
  required: z.boolean().optional(),
  title: z.string().min(1).max(64),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  type: z.enum(EXTENSION_COMMAND_ARGUMENT_TYPE).exclude(['select']),
});

export const ExtensionCommandArgumentSchema = z.discriminatedUnion('type', [
  ExtensionCommandArgumentBaseSchema,
  ExtensionCommandArgumentBaseSchema.merge(
    z.object({
      type: z.literal('select'),
      options: z
        .object({
          label: z.string().min(1),
          value: z.string().min(1),
        })
        .array()
        .max(4),
    }),
  ),
]);

export const ExtensionConfigBaseSchema = z.object({
  name: z.string().min(1).max(64),
  title: z.string().min(1).max(128),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  type: z.enum(EXTENSION_CONFIG_TYPE).exclude(['select', 'input:file']),
  defaultValue: z.union([z.string(), z.boolean(), z.number()]).optional(),
});

export const ExtensionConfigSchema = z.discriminatedUnion('type', [
  ExtensionConfigBaseSchema,
  ExtensionConfigBaseSchema.merge(
    z.object({
      type: z.literal('select'),
      options: z
        .object({
          label: z.string().min(1),
          value: z.string().min(1),
        })
        .array()
        .max(4),
    }),
  ),
  ExtensionConfigBaseSchema.merge(
    z.object({
      type: z.literal('input:file'),
      fileFilter: z
        .object({
          name: z.string().min(0),
          extensions: z.string().array().min(1),
        })
        .array()
        .optional(),
    }),
  ),
]);
export type ExtensionConfig = z.infer<typeof ExtensionConfigSchema>;

const ExtensionCommandBase = z.object({
  name: z.string().min(1),
  icon: iconSchema.optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  title: z.string().min(1).max(48),
  type: z.enum(EXTENSION_COMMAND_TYPE).exclude(['script']),
  config: ExtensionConfigSchema.array().optional(),
  arguments: ExtensionCommandArgumentSchema.array().optional(),
  context: z
    .custom<'all' | `host:${string}`>(
      (val) =>
        typeof val === 'string' && (val.startsWith('host') || val === 'all'),
      {
        message:
          'Command context must be "All" or match the "host:URL" pattern',
      },
    )
    .array()
    .optional(),
});
export const ExtensionCommandSchema = z.discriminatedUnion('type', [
  ExtensionCommandBase,
  ExtensionCommandBase.merge(
    z.object({
      type: z.literal('script'),
      isInternal: z.boolean().optional(),
    }),
  ),
]);
export type ExtensionCommand = z.infer<typeof ExtensionCommandSchema>;

export const ExtensionManifestSchema = z.object({
  icon: iconSchema,
  $apiVersion: z.string(),
  version: z.string().min(1),
  title: z.string().min(3).max(64),
  author: z.string().min(1).max(24),
  description: z.string().min(12).max(128),
  commands: ExtensionCommandSchema.array().min(1),
  config: ExtensionConfigSchema.array().optional(),
  categories: z
    .enum(EXTENSION_CATEGORIES)
    .array()
    .min(1, {
      message: `Extension must have at least one category.\nAvailable categories: ${EXTENSION_CATEGORIES.join(',')}`,
    })
    .transform((data) => [...new Set(data)]),
  credentials: ExtensionCredentialSchema.array().optional(),
  permissions: z.enum(EXTENSION_PERMISSIONS).array().optional(),
  name: z
    .string()
    .regex(URL_FRIENDLY_REGEX, {
      message:
        'The name must be URL-friendly. It can only contain letters, numbers, and _- characters',
    })
    .describe('The name must be URL friendly'),
});
export type ExtensionManifest = z.infer<typeof ExtensionManifestSchema>;

export type ExtensionCommandArgument = z.infer<
  typeof ExtensionCommandArgumentSchema
>;

export type {
  ExtensionConfigType,
  ExtensionPermissions,
  ExtensionCommandType,
  ExtensionCommandArgumentType,
};
export {
  URL_FRIENDLY_REGEX,
  EXTENSION_CATEGORIES,
  EXTENSION_CONFIG_TYPE,
  EXTENSION_PERMISSIONS,
  EXTENSION_COMMAND_TYPE,
  EXTENSION_COMMAND_ARGUMENT_TYPE,
};
