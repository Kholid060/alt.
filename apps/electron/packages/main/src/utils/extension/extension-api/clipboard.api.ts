import { ExtensionError } from '#packages/common/errors/ExtensionError';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import type { NativeImage } from 'electron';
import { clipboard, nativeImage } from 'electron';
import { onExtensionIPCEvent } from '../extension-api-event';

onExtensionIPCEvent('clipboard.read', async (_, format) => {
  switch (format) {
    case 'html':
      return clipboard.readHTML();
    case 'image':
      return clipboard.readImage().toDataURL();
    case 'rtf':
      return clipboard.readRTF();
    case 'text':
      return clipboard.readText();
    default:
      throw new ExtensionError(`"${format}" is an invalid clipboard format`);
  }
});

const EXT_CLIPBOARD_FORMATS: ExtensionAPI.clipboard.ClipboardContentType[] = [
  'html',
  'image',
  'rtf',
  'text',
];
onExtensionIPCEvent('clipboard.write', async (_, format, value) => {
  if (!EXT_CLIPBOARD_FORMATS.includes(format)) {
    throw new ExtensionError(`"${format}" is an invalid clipboard format`);
  }

  let clipboardVal: string | NativeImage = value;
  if (format === 'image') clipboardVal = nativeImage.createFromDataURL(value);

  clipboard.write({
    [format]: clipboardVal,
  });
});
