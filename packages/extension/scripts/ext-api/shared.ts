import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const FLAT_EXT_API_FILENAME = 'flat-extension-api.d.ts';

export const SRC_DIR = path.join(__dirname, '../../src');
export const DIST_DIR = path.join(__dirname, '../../dist');
export const EXT_API_DIR = path.join(SRC_DIR, 'extension-api');

export type FlatExtApiType = { propPath: string; namespacePath: string };

export type BuildExtensionApi = (apis: {
  values: FlatExtApiType[];
  actions: FlatExtApiType[];
  requireValues: FlatExtApiType[];
}) => Promise<void>;

export interface ExtensionAPINamespace {
  name: string;
  path: string;
}
