import { app, session } from 'electron';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

const EXT_ID = 'fmkadmapgofadopljbjfkapdkoienihi';

export async function devtoolsExtInstaller() {
  try {
    if (!import.meta.env.DEV) return;

    await app.whenReady();

    const extDir = path.join(
      os.homedir(),
      '/AppData/Local/Google/Chrome/User Data/Default/Extensions',
      EXT_ID,
    );
    if (!fs.existsSync(extDir)) {
      console.error('DevTools extension not found');
      return;
    }

    const [version] = await fs.readdir(extDir);
    if (!version) return;

    await session.defaultSession.loadExtension(path.join(extDir, version));
  } catch (error) {
    console.error(error);
  }
}
