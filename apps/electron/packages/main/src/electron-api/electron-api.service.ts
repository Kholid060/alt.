import { KeyboardKey, Keyboard } from '@alt-dot/native';
import { Injectable } from '@nestjs/common';
import { BrowserWindow, dialog } from 'electron';

@Injectable()
export class ElectronApiService {
  clipboardPaste() {
    const keys = [
      process.platform === 'darwin' ? KeyboardKey.Meta : KeyboardKey.Control,
      KeyboardKey.V,
    ];
    Keyboard.keyDown(...keys);
    Keyboard.keyUp(...keys);
  }

  openDialog(
    options: Electron.OpenDialogOptions,
    browserWindow?: BrowserWindow | null,
  ) {
    return browserWindow
      ? dialog.showOpenDialog(browserWindow, options)
      : dialog.showOpenDialog(options);
  }
}
