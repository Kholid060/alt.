import path from 'path';
import fs from 'fs-extra';
import archiver from 'archiver';
import { fileURLToPath } from 'url';
import packageJSON from '../package.json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_VERSION = packageJSON.version;
const BROWSER = process.env.__FIREFOX__ ? 'firefox' : 'chrome';
const ZIP_FILE_NAME = `${packageJSON.name}-${BROWSER}-v${APP_VERSION}.zip`;

const destDir = path.join(__dirname, '../dist');
const releasesDir = path.join(__dirname, '../releases', APP_VERSION);

await fs.ensureDir(releasesDir);

const archive = archiver('zip', { zlib: { level: 9 } });
const stream = fs.createWriteStream(path.join(releasesDir, ZIP_FILE_NAME));

archive
  .directory(destDir, false)
  .on('error', (error) => {
    console.error(error);
  })
  .pipe(stream);

stream.on('close', () => console.log('Success'));
archive.finalize();
