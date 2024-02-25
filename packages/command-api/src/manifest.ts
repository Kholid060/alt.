import { z } from 'zod';

export const URL_FRIENDLY_REGEX = /^[a-zA-Z0-9_-]*$/;

export const EXTENSION_PERMISSIONS = [
  'fs',
  'sqlite',
  'storage',
  'browser.tabs',
  'notifications',
  'installed-apps',
] as const;

export const EXTENSION_COMMAND_TYPE = ['action', 'view', 'view:json'] as const;

export const EXTENSION_COMMAND_CONTEXT = ['all', 'url'] as const;

export const ExtensionCommandSchema = z.object({
  name: z.string().min(1),
  subtitle: z.string().optional(),
  title: z.string().min(1).max(48),
  icon: z.string().min(1).optional(),
  type: z.enum(EXTENSION_COMMAND_TYPE),
  keywords: z.string().array().optional(),
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
  description: z.string().min(12).max(128),
  commands: ExtensionCommandSchema.array().min(1),
  permissions: z.enum(EXTENSION_PERMISSIONS).array().optional(),
  name: z
    .string()
    .regex(URL_FRIENDLY_REGEX)
    .describe('The name must be URL friendly'),
});

export type ExtensionCommand = z.infer<typeof ExtensionCommandSchema>;

export type ExtensionManifest = z.infer<typeof ExtensionManifestSchema>;
