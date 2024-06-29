export interface AppCryptoCreateHashOptions {
  outputLength?: number | undefined;
  digest?: 'base64' | 'base64url' | 'hex' | undefined;
}

export type AppCryptoCreateHashAlgorithm = 'sha256' | 'shake256';
