import path from 'path';
import {
  ExportedDeclarations,
  ModuleDeclaration,
  Project,
  SyntaxKind,
} from 'ts-morph';
import buildExtApiTypes from './build-ext-types';
import { emptyDir, ensureDir } from 'fs-extra';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '../../dist');
const TYPES_DIR = path.join(__dirname, '../../types');

export type FlatExtApiType = [string, string];

export type BuildExtensionApi = (apis: {
  values: FlatExtApiType[];
  actions: FlatExtApiType[];
}) => Promise<void>;

async function buildExtensionAPI() {
  await ensureDir(DIST_DIR);
  await emptyDir(DIST_DIR);

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

  await buildExtApiTypes({ actions: actionsExtApis, values: valuesExtApis });
}

buildExtensionAPI();
