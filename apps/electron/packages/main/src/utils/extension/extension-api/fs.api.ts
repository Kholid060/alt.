import fs from 'fs-extra';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import ExtensionIPCEvent from '../ExtensionIPCEvent';

const getWriteContent = (
  content: string | ArrayBuffer,
  options: Partial<ExtensionAPI.fs.WriteOptions>,
) => {
  if (typeof content === 'string' && options.stringType === 'base64') {
    return Buffer.from(content, 'base64');
  }

  return content;
};

ExtensionIPCEvent.instance.on('fs.exists', (_, path) => {
  return fs.pathExists(path);
});

ExtensionIPCEvent.instance.on('fs.readFile', async (_, path, options = {}) => {
  return fs.readFile(path, options.encoding ?? '');
});

ExtensionIPCEvent.instance.on('fs.writeFile', (_, path, data, options = {}) => {
  return fs.writeFile(path, getWriteContent(data, options), {
    encoding: options.encoding,
  });
});

ExtensionIPCEvent.instance.on(
  'fs.appendFile',
  (_, path, data, options = {}) => {
    return fs.appendFile(path, getWriteContent(data, options), {
      encoding: options.encoding,
    });
  },
);

ExtensionIPCEvent.instance.on('fs.readJSON', (_, path) => {
  return fs.readJSON(path);
});
