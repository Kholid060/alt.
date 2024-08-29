import fs from 'fs-extra';
import path from 'node:path';
import capitalize from 'lodash-es/capitalize';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_PATH = path.join(__dirname, '../src');

const COMPONENTS = [
  'list',
  'form',
  'text',
  'input',
  'image',
  'icons',
  'label',
  'select',
  'switch',
  'button',
  'checkbox',
  'textarea',
  'skeleton',
];
const BASE_UI_PATH = '@altdot/ui/dist/components/ui';

async function componentExtractor(name: string) {
  const importName = `Import${capitalize(name)}`;

  let exportTemplate = '';

  const components = await import(`${BASE_UI_PATH}/${name}`);
  for (const component in components) {
    exportTemplate += `export const ${component}: typeof ${importName}.${component} = (<any>self).$${component};\n`;
  }

  return {
    export: exportTemplate.trimEnd(),
    exportType: `export type * from '${`${BASE_UI_PATH}/${name}`}';`,
    import: `import * as ${importName} from '${BASE_UI_PATH}/${name}';`,
  };
}

async function main() {
  const componentTemplate: {
    import: string[];
    export: string[];
    exportType: string[];
  } = {
    import: [],
    export: [],
    exportType: [],
  };

  await Promise.all(
    COMPONENTS.map(async (name) => {
      const component = await componentExtractor(name);
      componentTemplate.export.push(component.export);
      componentTemplate.import.push(component.import);
      componentTemplate.exportType.push(component.exportType);
    }),
  );

  const template = `/* eslint-disable */\n// GENERATED FILE\n\n${componentTemplate.import.join('\n')}\n\n${componentTemplate.export.join('\n')}\n\n${componentTemplate.exportType.join('\n')}\n`;
  const componentMapPath = path.join(SRC_PATH, 'components/components-map.ts');
  console.log(path.resolve(componentMapPath));

  await fs.writeFile(componentMapPath, template);
}
main();
