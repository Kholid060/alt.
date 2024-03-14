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
import buildExtApiFile from './build-ext-file';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '../../dist');
const TYPES_DIR = path.join(__dirname, '../../types');

const VALUE_API_COMMENT = '@ext-api-value';

export type FlatExtApiType = [string, string];

export type BuildExtensionApi = (apis: {
  values: FlatExtApiType[];
  actions: FlatExtApiType[];
  requireValues: FlatExtApiType[];
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
  const requireValues: FlatExtApiType[] = [];
  const actionsExtApis: FlatExtApiType[] = [];

  const seenAPIPath = new Set<string>();

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
          case SyntaxKind.FunctionDeclaration:
          case SyntaxKind.VariableDeclaration: {
            const path = `${varPath}${varPath ? '.' : ''}${name}`;
            if (seenAPIPath.has(path)) continue;

            seenAPIPath.add(path);

            const value: FlatExtApiType = [path, `typeof ExtensionAPI.${path}`];

            const isFunction =
              item.getKind() === SyntaxKind.FunctionDeclaration;

            isFunction ? actionsExtApis.push(value) : valuesExtApis.push(value);

            const comment = item.getPreviousSiblingIfKind(
              SyntaxKind.SingleLineCommentTrivia,
            );
            if (comment && comment.getText().includes(VALUE_API_COMMENT)) {
              requireValues.push(value);
            }

            break;
          }
        }
      }
    });
  };

  handleExportedDeclaration(module.getExportedDeclarations());

  const payload: Parameters<BuildExtensionApi>[0] = {
    requireValues,
    values: valuesExtApis,
    actions: actionsExtApis,
  };

  await buildExtApiTypes(payload);
  await buildExtApiFile(payload);
}

buildExtensionAPI();
