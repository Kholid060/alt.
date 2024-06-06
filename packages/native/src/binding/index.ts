import { createRequire } from 'module';
import { KeyboardKey } from './KeyboardKey';

export { KeyboardKey } from './KeyboardKey';

const _require = createRequire(import.meta.url);
const nativeModule = _require('./index.node');

export class Keyboard {
  static type(text: string) {
    nativeModule.type(text);
  }

  static keyDown(...keys: KeyboardKey[]) {
    nativeModule.press('down', ...keys);
  }

  static keyUp(...keys: KeyboardKey[]) {
    nativeModule.press('up', ...keys);
  }
}
