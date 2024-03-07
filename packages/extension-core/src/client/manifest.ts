import { z } from 'zod';

export const URL_FRIENDLY_REGEX = /^[a-zA-Z0-9_-]*$/;

export const EXTENSION_PERMISSIONS = [
  'fs',
  'sqlite',
  'storage',
  'clipboard',
  'browser.tabs',
  'notifications',
  'installed-apps',
] as const;

export const EXTENSION_COMMAND_TYPE = ['action', 'view', 'view:json'] as const;

export const EXTENSION_COMMAND_CONTEXT = ['all', 'url'] as const;

export const EXTENSION_COMMAND_ARGUMENT_TYPE = [
  'toggle',
  'select',
  'input:text',
  'input:number',
] as const;

const ExtensionCommandArgumentBaseSchema = z.object({
  name: z.string().min(1).max(32),
  required: z.boolean().optional(),
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

export const ExtensionCommandSchema = z.object({
  name: z.string().min(1),
  subtitle: z.string().optional(),
  title: z.string().min(1).max(48),
  icon: z.string().min(1).optional(),
  type: z.enum(EXTENSION_COMMAND_TYPE),
  alias: z.string().min(3).max(9).optional(),
  arguments: ExtensionCommandArgumentSchema.array().optional(),
  context: z
    .enum(EXTENSION_COMMAND_CONTEXT)
    .default('all')
    .or(z.string().startsWith('host:')),
});

export const ExtensionManifestSchema = z.object({
  icon: z.string().min(1),
  version: z.string().min(1),
  title: z.string().min(3).max(64),
  author: z.string().min(1).max(24),
  $apiVersion: z.string().optional(),
  description: z.string().min(12).max(128),
  commands: ExtensionCommandSchema.array().min(1),
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
