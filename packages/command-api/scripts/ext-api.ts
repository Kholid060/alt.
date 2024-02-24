import path from 'path';
import fs from 'fs-extra';
import { ExportedDeclarations, FunctionTypeNode, ModuleDeclaration, Project, StructureKind, SyntaxKind, TypeChecker, VariableDeclaration, VariableStatement, forEachStructureChild } from 'ts-morph';

const DIST_DIR = path.join(__dirname, '../dist');
const TYPES_DIR = path.join(__dirname, '../types');

(async () => {
  const project = new Project();
  project.addSourceFilesAtPaths(path.join(TYPES_DIR, '/**/extension.d.ts'));

  const sourceFile = project.getSourceFileOrThrow('extension.d.ts');
  const module = sourceFile.getModule('_extension');
  if (!module) throw new Error("Can't find _extension module");

  const extApis: [string, 'value' | 'function'][] = [];

  const handleExportedDeclaration = (
    declarations: ReadonlyMap<string, ExportedDeclarations[]>,
    varPath: string = ''
  ) => {
    declarations.forEach((items, name) => {
      for (const item of items) {
        switch (item.getKind()) {
          case SyntaxKind.ModuleDeclaration: {
            const exportedDeclarations = (item as ModuleDeclaration).getExportedDeclarations();
            handleExportedDeclaration(exportedDeclarations, varPath ? `${varPath}.${name}` : name);
            break;
          }
          case SyntaxKind.VariableDeclaration: {
            const finalPath = `${varPath}${varPath ? '.' : ''}${name}`;
            const isFunc = item.getChildren().some((child) => child.getKindName() === 'FunctionType');
            extApis.push([finalPath, isFunc ? 'function' : 'value']);

            break;
          }
        }
      }
    });
  }

  handleExportedDeclaration(module.getExportedDeclarations());

  const stringifyApi = extApis.map((val) => JSON.stringify(val));
  const apiFileStr = stringifyApi.join(',');

  const extAPIDtsStr = stringifyApi.reduce<string>((acc, str, index) => {
    const separator = index === extApis.length - 1
      ? ''
      : ` | \n`;
    acc += `${index > 0 ? '\t' : ''}${str}${separator}`;

    return acc;
  }, '');

  await fs.writeFile(
    path.join(DIST_DIR, 'ext-api.d.ts'),
    `declare const extAPI: Array<${extAPIDtsStr}>;\nexport default extAPI;`,
    'utf8'
  );

  await fs.writeFile(
    path.join(DIST_DIR, 'ext-api.js'),
    `module.exports = [${apiFileStr}];`,
    'utf8'
  );

  await fs.writeFile(
    path.join(DIST_DIR, 'ext-api.mjs'),
    `export default [${apiFileStr}];`,
    'utf8'
  );
})();

