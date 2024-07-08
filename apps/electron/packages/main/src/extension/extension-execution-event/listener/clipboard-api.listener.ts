import { Injectable } from '@nestjs/common';
import { OnExtensionAPI } from '/@/common/decorators/extension.decorator';
import { ExtensionApiEvent } from '../events/extension-api.event';
import { NativeImage, clipboard, nativeImage } from 'electron';
import { CustomError } from '#packages/common/errors/custom-errors';
import ExtensionAPI from '@altdot/extension-core/types/extension-api';
import { BrowserWindowService } from '/@/browser-window/browser-window.service';
import { KeyboardKey, Keyboard } from '@altdot/native';

const EXT_CLIPBOARD_FORMATS: ExtensionAPI.clipboard.ClipboardContentType[] = [
  'html',
  'image',
  'rtf',
  'text',
];

@Injectable()
export class ExtensionClipboardApiListener {
  constructor(private browserWindow: BrowserWindowService) {}

  @OnExtensionAPI('clipboard.read')
  async clipboardRead({ args: [format] }: ExtensionApiEvent<'clipboard.read'>) {
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

  @OnExtensionAPI('clipboard.write')
  async clipboardWrite({
    args: [format, value],
  }: ExtensionApiEvent<'clipboard.write'>) {
    if (!EXT_CLIPBOARD_FORMATS.includes(format)) {
      throw new CustomError(`"${format}" is an invalid clipboard format`);
    }

    let clipboardVal: string | NativeImage = value;
    if (format === 'image') clipboardVal = nativeImage.createFromDataURL(value);

    clipboard.write({
      [format]: clipboardVal,
    });
  }

  @OnExtensionAPI('clipboard.paste')
  async clipboardPaste({
    args: [value],
  }: ExtensionApiEvent<'clipboard.paste'>) {
    const content = typeof value === 'string' ? value : JSON.stringify(value);
    clipboard.writeText(content);

    const pasteValue = async () => {
      const keys = [
        process.platform === 'darwin' ? KeyboardKey.Meta : KeyboardKey.Control,
        KeyboardKey.V,
      ];
      Keyboard.keyDown(...keys);
      Keyboard.keyUp(...keys);
    };

    const windowCommand = await this.browserWindow.get('command', {
      noThrow: true,
      autoCreate: false,
    });

    if (windowCommand) await windowCommand.tempHideWindow(() => pasteValue());
    else await pasteValue();
  }
}
