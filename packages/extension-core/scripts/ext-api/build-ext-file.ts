import { setProperty } from 'dot-prop';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { BuildExtensionApi, FlatExtApiType } from '.';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXT_API_FILENAME = 'extensionApiBuilder';
const DIST_DIR = path.join(__dirname, '../../dist');

function apiFileTemplate(apiObj: Record<string, string>) {
  function replacer(_key: string, value: unknown) {
    if (typeof value !== 'string') return value;

    const [type, path] = value.split('::');

    return type === 'action'
      ? `~~apiHandler.bind(context, '${path}')~~`
      : `~~values['${path}']~~`;
  }

  return `
// GENERATED FILE
function ${EXT_API_FILENAME}({ apiHandler, context, values }) {
  return ${JSON.stringify(apiObj, replacer, 2)}
}

export default ${EXT_API_FILENAME};
`.replaceAll(/~~"|"~~/g, '');
}

function apiFileTypeTemplate(values: FlatExtApiType[]) {
  return `
import type ExtensionAPI from '../types/extension-api';
import type { FlatValueExtensionAPI } from './flat-extension-api';

interface ExtApiValues extends FlatValueExtensionAPI {
  ${values.map(([path, value]) => `'${path}': ${value};`).join('\t\n')}
}

declare function ${EXT_API_FILENAME}(detail: {
  context?: unknown;
  values: ExtApiValues;
  apiHandler: (...args: any[]) => Promise<unknown>;
}): ExtensionAPI;

export { ${EXT_API_FILENAME} as default }
`;
}

const buildExtApiFile: BuildExtensionApi = async ({
  actions,
  values,
  requireValues,
}) => {
  const api: Record<string, string> = {};

  const seen = new Set();
  for (const [apiPath] of [...requireValues, ...values]) {
    seen.add(apiPath);
    setProperty(api, apiPath, `value::${apiPath}`);
  }
  for (const [apiPath] of actions) {
    if (seen.has(apiPath)) continue;
    setProperty(api, apiPath, `action::${apiPath}`);
  }

  await fs.writeFile(
    path.join(DIST_DIR, `${EXT_API_FILENAME}.js`),
    apiFileTemplate(api),
    'utf8',
  );
  await fs.writeFile(
    path.join(DIST_DIR, `${EXT_API_FILENAME}.d.ts`),
    apiFileTypeTemplate(requireValues),
    'utf8',
  );
};

export default buildExtApiFile;
