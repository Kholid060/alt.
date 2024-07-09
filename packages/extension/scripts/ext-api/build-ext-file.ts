import { setProperty } from 'dot-prop';
import path from 'path';
import fs from 'fs-extra';
import { FlatExtApiType, BuildExtensionApi, DIST_DIR } from './shared';

const EXT_API_FILENAME = 'extensionApiBuilder';

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
import type { ExtensionAPI } from './extension-api';
import type { FlatValueExtensionAPI } from './flat-extension-api';

export interface ExtensionAPIValues extends FlatValueExtensionAPI {
  ${values.map(({ propPath, namespacePath }) => `'${propPath}': ${namespacePath};`).join('\t\n')}
}

declare function ${EXT_API_FILENAME}(detail: {
  context?: unknown;
  values: ExtensionAPIValues;
  apiHandler: (...args: any[]) => Promise<unknown>;
}): typeof ExtensionAPI;

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
  for (const { propPath } of [...requireValues, ...values]) {
    seen.add(propPath);
    setProperty(api, propPath, `value::${propPath}`);
  }
  for (const { propPath } of actions) {
    if (seen.has(propPath)) continue;
    setProperty(api, propPath, `action::${propPath}`);
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
