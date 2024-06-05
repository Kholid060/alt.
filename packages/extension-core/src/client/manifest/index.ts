import { z } from 'zod';
import { ExtensionCredentialSchema } from './manifest-credential';

export const URL_FRIENDLY_REGEX = /^[a-zA-Z0-9_-]*$/;

export const EXTENSION_PERMISSIONS = [
  'fs',
  'shell',
  'sqlite',
  'storage',
  'fs.read',
  'fs.write',
  'clipboard',
  'notifications',
  'installed-apps',
  'browser.activeTab',
] as const;

export const EXTENSION_COMMAND_TYPE = [
  'view',
  'action',
  'script',
  'view:json',
] as const;
export type ExtensionCommandType = (typeof EXTENSION_COMMAND_TYPE)[number];

export const EXTENSION_COMMAND_CONTEXT = ['all'] as const;

export const EXTENSION_COMMAND_ARGUMENT_TYPE = [
  'toggle',
  'select',
  'input:text',
  'input:number',
  'input:password',
] as const;
export type ExtensionCommandArgumentType =
  (typeof EXTENSION_COMMAND_ARGUMENT_TYPE)[number];

export const EXTENSION_CONFIG_TYPE = [
  'select',
  'toggle',
  'input:text',
  'input:file',
  'input:number',
  'input:password',
  'input:directory',
] as const;
export type ExtensionConfigType = (typeof EXTENSION_CONFIG_TYPE)[number];

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

export const ExtensionCommandSchema = z.object({
  name: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  title: z.string().min(1).max(48),
  icon: z.string().min(1).optional(),
  type: z.enum(EXTENSION_COMMAND_TYPE),
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

export const ExtensionManifestSchema = z.object({
  icon: z.string().min(1),
  version: z.string().min(1),
  title: z.string().min(3).max(64),
  author: z.string().min(1).max(24),
  $apiVersion: z.string().optional(),
  description: z.string().min(12).max(128),
  commands: ExtensionCommandSchema.array().min(1),
  config: ExtensionConfigSchema.array().optional(),
  credentials: ExtensionCredentialSchema.array().optional(),
  permissions: z.enum(EXTENSION_PERMISSIONS).array().optional(),
  name: z
    .string()
    .regex(URL_FRIENDLY_REGEX)
    .describe('The name must be URL friendly'),
});

export type ExtensionCommandArgument = z.infer<
  typeof ExtensionCommandArgumentSchema
>;

export type ExtensionCommand = z.infer<typeof ExtensionCommandSchema>;

export type ExtensionManifest = z.infer<typeof ExtensionManifestSchema>;

export type ExtensionConfig = z.infer<typeof ExtensionConfigSchema>;