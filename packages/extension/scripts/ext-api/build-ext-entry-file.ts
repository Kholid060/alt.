import path from 'path';
import { EXT_API_DIR, ExtensionAPINamespace } from './shared';
import { camelCase } from 'lodash-es';
import fs from 'fs-extra';

const POSIX_EXT_API_DIR = EXT_API_DIR.split(path.sep).join(path.posix.sep);

function fileTemplate(content: {
  import: string;
  vars: string;
  export: string;
}) {
  return `// GENERATED FILE
${content.import}

declare namespace ExtensionAPI {
${content.vars}

${content.export}
}

export { ExtensionAPI, ExtensionAPI as _extension };
`;
}

const jsFileContent = `// GENERATED FILE
export const _extension = self._extension;
`;

export async function buildExtEntryFile(namespaces: ExtensionAPINamespace[]) {
  let importStr = '';
  let variableStr = '';
  let exportTypeStr = '';

  for (const item of namespaces) {
    const relativePath = item.path
      .replace(POSIX_EXT_API_DIR, '.')
      .replace('.d.ts', '');

    importStr += `import { ${item.name} as Imported${item.name} } from '${relativePath}';\n`;
    variableStr += `  const ${camelCase(item.name)}: ${item.name}.Static;\n`;
    exportTypeStr += `  export import ${item.name} = Imported${item.name};\n`;
  }

  const fileStr = fileTemplate({
    import: importStr.trimEnd(),
    vars: variableStr.trimEnd(),
    export: exportTypeStr.trimEnd(),
  });

  await fs.writeFile(path.join(EXT_API_DIR, 'index.d.ts'), fileStr);
  await fs.writeFile(path.join(EXT_API_DIR, 'index.js'), jsFileContent);
}
