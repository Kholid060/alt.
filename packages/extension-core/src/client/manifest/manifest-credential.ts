import { z } from 'zod';

export const ExtensionCredentialOAuth2Schema = z.object({
  type: z.literal('oauth2'),
  grantType: z.enum(['code', 'pkce', 'client_credentials']),
  authorizeUrl: z
    .string()
    .min(1, { message: 'authorizeUrl is required' })
    .url(),
  extraParams: z.union([
    z.string(),
    z.record(z.string(), z.union([z.string(), z.number()])),
  ]),
  scope: z.string().default(''),
  tokenUrl: z.string().min(1, { message: 'tokenUrl is required' }).url(),
});
export type ExtensionCredentialOAuth2 = z.infer<
  typeof ExtensionCredentialOAuth2Schema
>;

export const ExtensionCredentialSchema = z.object({
  description: z.string().optional(),
  documentationUrl: z.string().url().optional(),
  providerId: z.string().min(1, { message: 'providerId is required' }),
  auth: z.discriminatedUnion('type', [ExtensionCredentialOAuth2Schema]),
  providerName: z.string().min(1, { message: 'providerName is required' }),
  providerIcon: z.string().min(1, { message: 'providerIcon is required' }),
});
export type ExtensionCredential = z.infer<typeof ExtensionCredentialSchema>;
