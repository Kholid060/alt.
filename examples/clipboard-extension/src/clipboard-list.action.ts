import { _extension } from '@altdot/extension';

_extension.viewAction.async.on('test', () => {
  return Promise.resolve(true);
});
