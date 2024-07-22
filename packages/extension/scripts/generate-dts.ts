import chalk from 'chalk';
import { JsxEmit } from 'typescript';
import { ModuleKind, Project, ScriptTarget } from 'ts-morph';

console.log(chalk.yellow('🔃 Generating DTS'));

const OUT_DIR_NAME = 'dist';

const project = new Project({
  compilerOptions: {
    declaration: true,
    outDir: OUT_DIR_NAME,
    declarationMap: false,
    jsx: JsxEmit.ReactJSX,
    lib: ['ES2015', 'DOM'],
    emitDeclarationOnly: true,
    module: ModuleKind.ESNext,
    target: ScriptTarget.ESNext,
    declarationDir: OUT_DIR_NAME,
  },
  tsConfigFilePath: './tsconfig.json',
});

await project.emit({ emitOnlyDtsFiles: true });

console.log(chalk.green('✅ DTS Generated'));

