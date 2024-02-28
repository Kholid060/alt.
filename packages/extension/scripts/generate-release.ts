import fs from 'fs-extra';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { version } from '../package.json';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DIST_DIR = join(__dirname, '..', 'dist');
const RELEASES_DIR = join(__dirname, '..', 'releases');
const RELEASE_VERSION_DIR = join(RELEASES_DIR, version);

(async () => {
  if (!fs.existsSync(DIST_DIR)) throw new Error('Run "build" script first');

  await fs.ensureDir(RELEASE_VERSION_DIR);
  await fs.emptyDir(RELEASE_VERSION_DIR);

  await fs.copy(DIST_DIR, RELEASE_VERSION_DIR);
})();
