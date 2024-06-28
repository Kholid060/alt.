import { z } from 'zod';

export const OAuth2CredentialValueSchema = z.object({
  clientId: z.string().min(1, { message: 'Missing clientId' }),
  clientSecret: z.string().min(1, { message: 'Missing clientId' }),
});
export type OAuth2CredentialValue = z.infer<typeof OAuth2ResponseSchema>;

export const OAuth2ResponseSchema = z.object({
  token_type: z.string(),
  access_token: z.string(),
  scope: z.string().default(''),
  expires_in: z.number().default(0),
  refresh_token: z.string().optional(),
});
export type OAuth2Response = z.infer<typeof OAuth2ResponseSchema>;
