import fs from 'fs-extra';
import { onExtensionIPCEvent } from '../extension-api-event';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';

const getWriteContent = (
  content: string | ArrayBuffer,
  options: Partial<ExtensionAPI.fs.WriteOptions>,
) => {
  if (typeof content === 'string' && options.stringType === 'base64') {
    return Buffer.from(content, 'base64');
  }

  return content;
};

onExtensionIPCEvent('fs.exists', (_, path) => {
  return fs.pathExists(path);
});

onExtensionIPCEvent('fs.readFile', async (_, path, options = {}) => {
  return fs.readFile(path, options.encoding ?? '');
});

onExtensionIPCEvent('fs.writeFile', (_, path, data, options = {}) => {
  return fs.writeFile(path, getWriteContent(data, options), {
    encoding: options.encoding,
  });
});

onExtensionIPCEvent('fs.appendFile', (_, path, data, options = {}) => {
  return fs.appendFile(path, getWriteContent(data, options), {
    encoding: options.encoding,
  });
});

onExtensionIPCEvent('fs.readJSON', (_, path) => {
  return fs.readJSON(path);
});
