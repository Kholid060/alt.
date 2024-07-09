import path from 'path';
import {
  InterfaceDeclaration,
  MethodSignature,
  Project,
  PropertySignature,
  SourceFile,
  SyntaxKind,
} from 'ts-morph';
import { camelCase } from 'lodash-es';
import buildExtApiTypes from './build-ext-types';
import { emptyDir, ensureDir } from 'fs-extra';
import buildExtApiFile from './build-ext-file';
import {
  FlatExtApiType,
  DIST_DIR,
  BuildExtensionApi,
  ExtensionAPINamespace,
  EXT_API_DIR,
} from './shared';
import { buildExtEntryFile } from './build-ext-entry-file';

const VALUE_API_COMMENT = '@ext-api-value';

class ExtensionAPIBuilder {
  private valuesExtApis: FlatExtApiType[] = [];
  private requireValues: FlatExtApiType[] = [];
  private actionsExtApis: FlatExtApiType[] = [];
  private namespaces: ExtensionAPINamespace[] = [];

  private seenAPIPath = new Set<string>();

  async start() {
    await ensureDir(DIST_DIR);
    await emptyDir(DIST_DIR);

    const project = new Project();
    project.addSourceFilesAtPaths(
      path.join(EXT_API_DIR, '/**/namespaces/*.d.ts'),
    );

    const files = project.getSourceFiles();
    await Promise.all(files.map((file) => this.walkSourceFile(file)));

    await buildExtEntryFile(this.namespaces);

    const payload: Parameters<BuildExtensionApi>[0] = {
      values: this.valuesExtApis,
      actions: this.actionsExtApis,
      requireValues: this.requireValues,
    };
    await buildExtApiTypes(payload);
    await buildExtApiFile(payload);
  }

  private async walkSourceFile(file: SourceFile) {
    const filePath = file.getFilePath();

    const modules = file.getModules();
    for (const module of modules) {
      const staticInterface = module.getInterface('Static');
      if (!staticInterface) continue;

      const moduleName = module.getName();
      this.extractAPIs(staticInterface, moduleName);

      if (!module.isNamedExport() || moduleName.includes('.')) continue;

      this.namespaces.push({
        path: filePath,
        name: module.getName(),
      });
    }
  }

  private extractAPIs(apiInterface: InterfaceDeclaration, moduleName: string) {
    const camelCaseModuleName = moduleName.split('.').map(camelCase).join('.');

    for (const member of apiInterface.getMembers()) {
      const memberKind = member.getKind();
      switch (memberKind) {
        case SyntaxKind.MethodSignature:
        case SyntaxKind.PropertySignature: {
          const prop = member as MethodSignature | PropertySignature;
          const isMethod = memberKind === SyntaxKind.MethodSignature;

          if (!isMethod && prop.getText().includes('.Static')) continue;

          const propPath = `${camelCaseModuleName}.${prop.getName()}`;
          if (this.seenAPIPath.has(propPath)) continue;

          this.seenAPIPath.add(propPath);
          const value: FlatExtApiType = {
            propPath,
            namespacePath: `ExtensionAPI.${moduleName}.Static['${prop.getName()}']`,
          };

          if (isMethod) this.actionsExtApis.push(value);
          else this.valuesExtApis.push(value);

          const comment = member.getPreviousSiblingIfKind(
            SyntaxKind.SingleLineCommentTrivia,
          );
          if (comment && comment.getText().includes(VALUE_API_COMMENT)) {
            this.requireValues.push(value);
          }

          break;
        }
      }
    }
  }
}

export default ExtensionAPIBuilder;
