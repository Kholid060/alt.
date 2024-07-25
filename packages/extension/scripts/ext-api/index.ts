import { ensureDir, emptyDir } from 'fs-extra';
import ExtensionAPIBuilder from './ExtensionAPIBuilder';
import { DIST_DIR } from './shared';
import { buildExtJSONSchema } from './build-ext-json-schema';

await ensureDir(DIST_DIR);
await emptyDir(DIST_DIR);

await new ExtensionAPIBuilder().start();

await buildExtJSONSchema();
