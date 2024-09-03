import fs from 'fs';
import { _extension } from '@altdot/extension';

console.log(fs);

_extension.viewAction.async.on('test', () => {
  return Promise.resolve(true);
});
