import path from 'path';
import fs from 'fs-extra';
import {
  ExportedDeclarations,
  ModuleDeclaration,
  Project,
  SyntaxKind,
} from 'ts-morph';

const FLAT_EXT_API_FILENAME = 'flat-extension-api.d.ts';

const DIST_DIR = path.join(__dirname, '../dist');
const TYPES_DIR = path.join(__dirname, '../types');

type FlatExtApiType = [string, string];

function flatExtensionAPITemplate(content: string) {
  return `
import ExtensionAPI from '../types/extension-api';

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
    .map(([name, value]) => `\t'${name}': ${value};`)
    .join('\n');

  return `interface Flat${type}ExtensionAPI {\n${typesStr}\n}\n`;
}
function getExtensionTypeValue(
  type: 'Action' | 'Value',
  types: FlatExtApiType[],
) {
  const valueStr = JSON.stringify(
    types.reduce<Record<string, string>>((acc, [key]) => {
      acc[key] = type.toLowerCase();

      return acc;
    }, {}),
  );

  return `!EXPORT_TYPE_flat${type}ExtensionAPI = ${valueStr};\n`;
}

async function buildExtensionAPI() {
  const project = new Project();
  project.addSourceFilesAtPaths(path.join(TYPES_DIR, '/**/extension-api.d.ts'));

  const sourceFile = project.getSourceFileOrThrow('extension-api.d.ts');
  const module = sourceFile.getModule('ExtensionAPI');
  if (!module) throw new Error("Can't find 'ExtensionAPI' module");

  const valuesExtApis: FlatExtApiType[] = [];
  const actionsExtApis: FlatExtApiType[] = [];

  const handleExportedDeclaration = (
    declarations: ReadonlyMap<string, ExportedDeclarations[]>,
    varPath: string = '',
  ) => {
    declarations.forEach((items, name) => {
      for (const item of items) {
        switch (item.getKind()) {
          case SyntaxKind.ModuleDeclaration: {
            const exportedDeclarations = (
              item as ModuleDeclaration
            ).getExportedDeclarations();
            handleExportedDeclaration(
              exportedDeclarations,
              varPath ? `${varPath}.${name}` : name,
            );
            break;
          }
          case SyntaxKind.VariableDeclaration: {
            const finalPath = `${varPath}${varPath ? '.' : ''}${name}`;
            const isFunc = item
              .getChildren()
              .some((child) => child.getKindName() === 'FunctionType');

            const value: FlatExtApiType = [
              finalPath,
              `typeof ExtensionAPI.${finalPath}`,
            ];

            isFunc ? actionsExtApis.push(value) : valuesExtApis.push(value);

            break;
          }
        }
      }
    });
  };

  handleExportedDeclaration(module.getExportedDeclarations());

  const flatApiType = flatExtensionAPITemplate(
    getExtensionType('Action', actionsExtApis) +
      getExtensionType('Value', valuesExtApis),
  );
  await fs.writeFile(
    path.join(DIST_DIR, FLAT_EXT_API_FILENAME),
    flatApiType,
    'utf8',
  );

  const extAPIFilename = FLAT_EXT_API_FILENAME.replace('.d.ts', '');
  const extAPIContent =
    getExtensionTypeValue('Action', actionsExtApis) +
    getExtensionTypeValue('Value', valuesExtApis);

  await fs.writeFile(
    path.join(DIST_DIR, `${extAPIFilename}.js`),
    flatExtensionAPIValueTemplate(
      extAPIContent.replaceAll('!EXPORT_TYPE_', 'exports.'),
      'module.exports =',
    ),
    'utf8',
  );

  await fs.writeFile(
    path.join(DIST_DIR, `${extAPIFilename}.mjs`),
    flatExtensionAPIValueTemplate(
      extAPIContent.replaceAll('!EXPORT_TYPE_', 'export const '),
      'export default',
    ),
    'utf8',
  );
}

export default buildExtensionAPI;
