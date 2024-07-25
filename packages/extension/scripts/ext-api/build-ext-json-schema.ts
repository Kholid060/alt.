import path from 'path';
import chalk from 'chalk';
import fs from 'fs-extra';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ExtensionManifestSchema } from '../../src/extension-manifest/index';
import { DIST_DIR } from './shared';

export async function buildExtJSONSchema() {
  console.log(chalk.yellow('🔃 Generating Extension Manifest JSON Schema'));

  const jsonSchemaPath = path.join(DIST_DIR, 'extension-manifest/schema.json');
  const jsonSchema = zodToJsonSchema(ExtensionManifestSchema);

  await fs.ensureDir(path.dirname(jsonSchemaPath));
  await fs.writeJSON(jsonSchemaPath, jsonSchema, { spaces: 2 });

  console.log(chalk.green('✅ Extension Manifest JSON Schema generated'));
}
