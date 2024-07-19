import path from 'path';
import chalk from 'chalk';
import fs from 'fs-extra';
import { createProgram, JsxEmit, ModuleKind, ScriptTarget } from 'typescript';

const CWD = process.cwd();
const OUT_DIR_NAME = 'dist';

await fs.ensureDir(path.join(CWD, OUT_DIR_NAME));

const program = createProgram(['./src/index.ts'], {
  declaration: true,
  outDir: OUT_DIR_NAME,
  declarationMap: false,
  jsx: JsxEmit.ReactJSX,
  lib: ['ES2015', 'DOM'],
  emitDeclarationOnly: true,
  module: ModuleKind.ESNext,
  target: ScriptTarget.ESNext,
  declarationDir: OUT_DIR_NAME,
});
program.emit(
  undefined,
  (fileName, data, writeByteOrderMark) => {
    console.log(chalk.gray(fileName));

    if (writeByteOrderMark) {
      data = '\uFEFF' + data;
    }

    const filePath = path.join(CWD, fileName);
    fs.ensureFileSync(filePath);
    fs.writeFileSync(filePath, data);
  },
  undefined,
  true,
);

console.log(chalk.green('✅ DTS Generated'));
