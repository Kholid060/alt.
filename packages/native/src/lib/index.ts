import { createRequire } from 'module';
import { KeyboardKey } from './KeyboardKey';
const require = createRequire(import.meta.url);

const nativeModule = require('../index.node');

export { KeyboardKey } from './KeyboardKey';

export class Keyboard {
  static type(...keys: KeyboardKey[]) {
    nativeModule.type(...keys);
  }

  static keyDown(...keys: KeyboardKey[]) {
    nativeModule.press('down', ...keys);
  }

  static keyUp(...keys: KeyboardKey[]) {
    nativeModule.press('up', ...keys);
  }
}
