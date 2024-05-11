import fs from 'fs-extra';
import { basename } from 'path';
import type { QuickJSContext, Scope } from 'quickjs-emscripten';

class WorkflowFileHandle {
  readonly path: string;
  readonly filename: string;
  readonly lastModified: string;

  constructor({ path, lastModified }: { path: string; lastModified: string }) {
    this.path = path;
    this.filename = basename(path);
    this.lastModified = lastModified;
  }

  async readFile(encoding?: BufferEncoding) {
    if (encoding) return fs.readFile(this.path, { encoding });
    return fs.readFile(this.path);
  }

  toJSHandle(vm: QuickJSContext, scope: Scope) {
    const object = scope.manage(vm.newObject());
    vm.setProp(
      object,
      '$type',
      scope.manage(vm.newString('WorkflowFileHandle')),
    );
    vm.setProp(object, 'path', scope.manage(vm.newString(this.path)));
    vm.setProp(object, 'filename', scope.manage(vm.newString(this.filename)));
    vm.setProp(
      object,
      'lastModified',
      scope.manage(vm.newString(this.lastModified)),
    );

    const readFileFunc = scope.manage(
      vm.newFunction('', (encodingHandle) => {
        const encoding =
          encodingHandle && vm.dump(scope.manage(encodingHandle));
        const promise = scope.manage(vm.newPromise());

        this.readFile(encoding)
          .then((value) => {
            const valueHandle =
              typeof value === 'string'
                ? vm.newString(value)
                : vm.newArrayBuffer(value.buffer);
            promise.resolve(scope.manage(valueHandle));
          })
          .catch((error) => {
            promise.reject(scope.manage(vm.newError(error)));
          });

        promise.settled.finally(vm.runtime.executePendingJobs);

        return promise.handle;
      }),
    );
    vm.setProp(object, 'readFile', readFileFunc);

    return object;
  }
}

export default WorkflowFileHandle;
