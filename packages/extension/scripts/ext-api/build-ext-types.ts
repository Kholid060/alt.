import path from 'path';
import fs from 'fs-extra';
import {
  BuildExtensionApi,
  DIST_DIR,
  FLAT_EXT_API_FILENAME,
  FlatExtApiType,
} from './shared';

function flatExtensionAPITemplate(content: string) {
  return `
import { ExtensionAPI } from './extension-api';

${content}

type FlatExtensionAPI = FlatActionExtensionAPI & FlatValueExtensionAPI;

declare const flatExtensionAPI: FlatExtensionAPI;
declare const flatValueExtensionAPI: FlatValueExtensionAPI;
declare const flatActionExtensionAPI: FlatActionExtensionAPI;

export { type FlatActionExtensionAPI, type FlatValueExtensionAPI, type FlatExtensionAPI, flatActionExtensionAPI, flatValueExtensionAPI };

export default flatExtensionAPI;
`;
}
function flatExtensionAPIValueTemplate(content: string, exportType: string) {
  return `
${content}

${exportType} { ...flatActionExtensionAPI, ...flatValueExtensionAPI };
`;
}

function getExtensionType(type: 'Action' | 'Value', types: FlatExtApiType[]) {
  const typesStr = types
    .map(({ propPath, namespacePath }) => `\t'${propPath}': ${namespacePath};`)
    .join('\n');

  return `interface Flat${type}ExtensionAPI {\n${typesStr}\n}\n`;
}
function getExtensionTypeValue(
  type: 'Action' | 'Value',
  types: FlatExtApiType[],
) {
  const valueStr = JSON.stringify(
    types.reduce<Record<string, string>>((acc, { propPath }) => {
      acc[propPath] = type.toLowerCase();

      return acc;
    }, {}),
  );

  return `!EXPORT_TYPE_flat${type}ExtensionAPI = ${valueStr};\n`;
}

const buildExtApiTypes: BuildExtensionApi = async ({ actions, values }) => {
  const flatApiType = flatExtensionAPITemplate(
    getExtensionType('Action', actions) + getExtensionType('Value', values),
  );
  await fs.writeFile(
    path.join(DIST_DIR, FLAT_EXT_API_FILENAME),
    flatApiType,
    'utf8',
  );

  const extAPIFilename = FLAT_EXT_API_FILENAME.replace('.d.ts', '');
  const extAPIContent =
    getExtensionTypeValue('Action', actions) +
    getExtensionTypeValue('Value', values);

  await fs.writeFile(
    path.join(DIST_DIR, `${extAPIFilename}.cjs`),
    flatExtensionAPIValueTemplate(
      extAPIContent.replaceAll('!EXPORT_TYPE_', 'exports.'),
      'module.exports =',
    ),
    'utf8',
  );

  await fs.writeFile(
    path.join(DIST_DIR, `${extAPIFilename}.js`),
    flatExtensionAPIValueTemplate(
      extAPIContent.replaceAll('!EXPORT_TYPE_', 'export const '),
      'export default',
    ),
    'utf8',
  );
};

export default buildExtApiTypes;
