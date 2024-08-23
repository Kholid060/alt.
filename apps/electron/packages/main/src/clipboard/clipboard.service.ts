import { CustomError } from '#packages/common/errors/custom-errors';
import { ExtensionAPI } from '@altdot/extension';
import { KeyboardKey, Keyboard } from '@altdot/native';
import { sleep } from '@altdot/shared';
import { Injectable } from '@nestjs/common';
import { BrowserWindow, clipboard, NativeImage, nativeImage } from 'electron';

const EXT_CLIPBOARD_FORMATS: ExtensionAPI.Clipboard.ClipboardContentType[] = [
  'html',
  'image',
  'rtf',
  'text',
];

@Injectable()
export class ClipboardService {
  read(format: ExtensionAPI.Clipboard.ClipboardContentType) {
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
        throw new CustomError(`"${format}" is an invalid clipboard format`);
    }
  }

  write(format: ExtensionAPI.Clipboard.ClipboardContentType, value: string) {
    if (!EXT_CLIPBOARD_FORMATS.includes(format)) {
      throw new CustomError(`"${format}" is an invalid clipboard format`);
    }

    let clipboardVal: string | NativeImage = value;
    if (format === 'image') clipboardVal = nativeImage.createFromDataURL(value);

    clipboard.write({
      [format]: clipboardVal,
    });
  }

  async paste(value?: unknown, targetForegroundApp: boolean = true) {
    const content =
      typeof value === 'string' ? value : value && JSON.stringify(value);
    if (typeof content === 'string') clipboard.writeText(content);

    const focusedWindow: BrowserWindow[] = [];
    if (targetForegroundApp) {
      BrowserWindow.getAllWindows().forEach((window) => {
        if (window.isFocused()) {
          window.blur();
          focusedWindow.push(window);
        }
      });
    }

    const keys = [
      process.platform === 'darwin' ? KeyboardKey.Meta : KeyboardKey.Control,
      KeyboardKey.V,
    ];
    Keyboard.keyDown(...keys);
    Keyboard.keyUp(...keys);

    await sleep(100);

    focusedWindow.forEach((window) => window.focus());
  }
}
