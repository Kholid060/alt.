import { ExtensionError } from '#packages/common/errors/custom-errors';
import type ExtensionAPI from '@repo/extension-core/types/extension-api';
import type { NativeImage } from 'electron';
import { clipboard, nativeImage } from 'electron';
import { Keyboard, KeyboardKey } from '@repo/native';
import ExtensionIPCEvent from '../ExtensionIPCEvent';
import WindowCommand from '/@/window/command-window';

ExtensionIPCEvent.instance.on('clipboard.read', async (_, format) => {
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
ExtensionIPCEvent.instance.on('clipboard.write', async (_, format, value) => {
  if (!EXT_CLIPBOARD_FORMATS.includes(format)) {
    throw new ExtensionError(`"${format}" is an invalid clipboard format`);
  }

  let clipboardVal: string | NativeImage = value;
  if (format === 'image') clipboardVal = nativeImage.createFromDataURL(value);

  clipboard.write({
    [format]: clipboardVal,
  });
});

ExtensionIPCEvent.instance.on('clipboard.paste', async (_, value) => {
  const content = typeof value === 'string' ? value : JSON.stringify(value);
  clipboard.writeText(content);

  await WindowCommand.instance.tempHideWindow(async () => {
    const keys = [
      process.platform === 'darwin' ? KeyboardKey.Meta : KeyboardKey.Control,
      KeyboardKey.V,
    ];
    Keyboard.keyDown(...keys);
    Keyboard.keyUp(...keys);
  });
});
