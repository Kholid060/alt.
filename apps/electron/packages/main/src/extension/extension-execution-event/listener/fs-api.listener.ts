import fs from 'fs-extra';
import { Injectable } from '@nestjs/common';
import { OnExtensionAPI } from '/@/common/decorators/extension.decorator';
import { ExtensionApiEvent } from '../events/extension-api.event';
import ExtensionAPI from '@alt-dot/extension-core/types/extension-api';

function getWriteContent(
  content: string | ArrayBuffer,
  options: Partial<ExtensionAPI.fs.WriteOptions>,
) {
  if (typeof content === 'string' && options.stringType === 'base64') {
    return Buffer.from(content, 'base64');
  }

  return content;
}

@Injectable()
export class ExtensionFSApiListener {
  constructor() {}

  @OnExtensionAPI('fs.exists')
  exists({ args: [path] }: ExtensionApiEvent<'fs.exists'>) {
    return fs.pathExists(path);
  }

  @OnExtensionAPI('fs.writeFile')
  writeFile({
    args: [path, data, options = {}],
  }: ExtensionApiEvent<'fs.writeFile'>) {
    return fs.writeFile(path, getWriteContent(data, options), {
      encoding: options.encoding,
    });
  }

  @OnExtensionAPI('fs.appendFile')
  appendFile({
    args: [path, data, options = {}],
  }: ExtensionApiEvent<'fs.appendFile'>) {
    return fs.appendFile(path, getWriteContent(data, options), {
      encoding: options.encoding,
    });
  }

  @OnExtensionAPI('fs.stat')
  async stat({ args: [path] }: ExtensionApiEvent<'fs.stat'>) {
    const stat = await fs.stat(path);

    return {
      size: stat.size,
      isFile: stat.isFile(),
      isDirectory: stat.isDirectory(),
      atime: stat.atime.toISOString(),
      mtime: stat.mtime.toISOString(),
      birthtime: stat.birthtime.toISOString(),
    };
  }

  @OnExtensionAPI('fs.readFile')
  readFile({ args: [path, options = {}] }: ExtensionApiEvent<'fs.readFile'>) {
    return fs.readFile(path, options.encoding ?? '') as Promise<
      string | Uint8Array
    >;
  }

  @OnExtensionAPI('fs.readJSON')
  readJSON({ args: [path] }: ExtensionApiEvent<'fs.readJSON'>) {
    return fs.readJSON(path);
  }
}
