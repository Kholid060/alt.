import type { BrowserSelectFileOptions } from '@altdot/shared';
import fs from 'fs-extra';
import path from 'path';
import mime from 'mime-types';
import { CustomError } from '#packages/common/errors/custom-errors';

export async function getFileDetail(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new CustomError(`No such file, open "${filePath}"`);
  }

  const fileName = path.basename(filePath);
  const stat = await fs.stat(filePath);
  if (!stat.isFile()) {
    throw new CustomError(`"${fileName}" is not a file`);
  }

  const buffer = await fs.readFile(filePath);

  return {
    fileName,
    contents: buffer,
    lastModified: stat.mtime.getTime(),
    mimeType: <string>mime.lookup(filePath),
  } as BrowserSelectFileOptions;
}
