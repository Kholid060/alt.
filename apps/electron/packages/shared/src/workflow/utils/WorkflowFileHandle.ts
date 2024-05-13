import fs from 'fs-extra';
import { isObject } from 'lodash-es';
import { basename } from 'path';
import type { QuickJSContext, Scope } from 'quickjs-emscripten';

type WorkflowFileHandleObject = Pick<
  WorkflowFileHandle,
  'filename' | 'path' | 'size' | 'lastModified'
>;

class WorkflowFileHandle {
  readonly path: string;
  readonly size: number;
  readonly filename: string;
  readonly lastModified: string;

  constructor({
    path,
    size,
    lastModified,
  }: {
    path: string;
    size: number;
    lastModified: string;
  }) {
    this.path = path;
    this.size = size;
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
    vm.setProp(object, 'size', scope.manage(vm.newNumber(this.size)));
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

  static isWorkflowFileHandle(
    value: unknown,
  ): value is WorkflowFileHandleObject {
    if (
      !isObject(value) ||
      !('$type' in value) ||
      value.$type !== 'WorkflowFileHandle'
    )
      return false;

    return ['filename', 'path', 'size', 'lastModified'].every((key) =>
      Object.hasOwn(value, key),
    );
  }
}

export default WorkflowFileHandle;
