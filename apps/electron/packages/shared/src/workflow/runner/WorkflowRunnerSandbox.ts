/* eslint-disable @typescript-eslint/no-explicit-any */
import { isObject } from '@altdot/shared';
import { getProperty, setProperty } from 'dot-prop';
import type { QuickJSContext, QuickJSRuntime } from 'quickjs-emscripten';
import { Scope, getQuickJS } from 'quickjs-emscripten';
import type WorkflowRunner from './WorkflowRunner';
import { getExactType } from '/@/utils/helper';
import WorkflowFileHandle from '../utils/WorkflowFileHandle';
import { WorkflowNodeExpressionRecords } from '@altdot/workflow';

const MUSTACHE_REGEX = /\{\{(.*?)\}\}/g;

function mustacheTemplateToCode(str: string) {
  let code = str;

  if (str.startsWith('{{') && str.endsWith('}}')) {
    code = str.slice(2, -2);
  } else {
    code =
      '`' +
      str.replaceAll(MUSTACHE_REGEX, (value) => `$${value.slice(1, -1)}`) +
      '`';
  }

  return `(() => ${code})()`;
}
function convertToJSHandle(vm: QuickJSContext, value: unknown, scope: Scope) {
  switch (typeof value) {
    case 'undefined':
      return scope.manage(vm.undefined);
    case 'bigint':
      return scope.manage(vm.newBigInt(value));
    case 'boolean':
      return scope.manage(value ? vm.true : vm.false);
    case 'number':
      return scope.manage(vm.newNumber(value));
    case 'string':
      return scope.manage(vm.newString(value));
    case 'object': {
      if (value === null) return scope.manage(vm.null);

      if (Array.isArray(value)) {
        const array = scope.manage(vm.newArray());
        value.forEach((item, index) => {
          vm.setProp(array, index, convertToJSHandle(vm, item, scope));
        });

        return array;
      }

      if (value instanceof WorkflowFileHandle) {
        return value.toJSHandle(vm, scope);
      }

      if (isObject(value)) {
        const object = vm.newObject();
        Object.keys(value).forEach((key) => {
          vm.setProp(object, key, convertToJSHandle(vm, value[key], scope));
        });

        return object;
      }
    }
  }

  throw new Error(`Can't convert "${getExactType(value)}" to JSHandle`);
}

const EXP_RUNTIME_MEMORY_LIMIT_BYTE = 1.5 * 1024 * 1024; // 1.5MB
const EXP_RUNTIME_MAX_STACK_SIZE_BYTE = 0.5 * 1024 * 1024; // 0.5MB

const CODE_RUNTIME_MEMORY_LIMIT_BYTE = 2.5 * 1024 * 1024; // 2.5MB
const CODE_RUNTIME_MAX_STACK_SIZE_BYTE = 1 * 1024 * 1024; // 1MB
const CODE_RUNTIME_MAX_AGE_MS = 2.5 * 1000 * 60; // 2.5 Minutesl

interface EvaluateExpressionOptions {
  data?: Record<PropertyKey, unknown>;
}
interface EvaluateCodeOptions {
  isPromise?: boolean;
  signal?: AbortSignal;
  data?: Record<PropertyKey, unknown>;
}

class WorkflowRunnerSandbox {
  private _expRuntime: QuickJSRuntime | null = null;

  constructor(private runner: WorkflowRunner) {}

  private async getExpRuntime() {
    if (this._expRuntime) return this._expRuntime;

    const quickJS = await getQuickJS();
    this._expRuntime = quickJS.newRuntime({
      memoryLimitBytes: EXP_RUNTIME_MEMORY_LIMIT_BYTE,
      maxStackSizeBytes: EXP_RUNTIME_MAX_STACK_SIZE_BYTE,
    });

    return this._expRuntime;
  }

  private injectContextGlobalVar(
    context: QuickJSContext,
    scope: Scope,
    data: Record<string, unknown> = {},
  ) {
    const getData = scope.manage(
      context.newFunction('', (pathHandle) => {
        const pathValue = context.dump(scope.manage(pathHandle));
        if (typeof pathValue !== 'string') {
          return scope.manage(
            context.newError('The path must be string or array of string'),
          );
        }

        const value = convertToJSHandle(
          context,
          getProperty(
            { ...data, ...this.runner.dataStorage.contextData },
            pathValue,
          ),
          scope,
        );

        return value;
      }),
    );
    const setVarsFunc = scope.manage(
      context.newFunction('', (name, value) => {
        const nameValue = context.dump(scope.manage(name));
        const valueValue = context.dump(scope.manage(value));

        this.runner.dataStorage.variables.set(nameValue, valueValue);
      }),
    );

    context.setProp(context.global, '$getData', getData);
    context.setProp(context.global, '$setVars', setVarsFunc);
  }

  async evaluateCode(
    code: string,
    { signal, isPromise, data = {} }: EvaluateCodeOptions = {},
  ) {
    const quickJS = await getQuickJS();

    return Scope.withScopeAsync(async (scope) => {
      const deadline = Date.now() + CODE_RUNTIME_MAX_AGE_MS;

      const runtime = scope.manage(
        quickJS.newRuntime({
          memoryLimitBytes: CODE_RUNTIME_MEMORY_LIMIT_BYTE,
          maxStackSizeBytes: CODE_RUNTIME_MAX_STACK_SIZE_BYTE,
          interruptHandler: () => {
            return Date.now() > deadline || signal?.aborted;
          },
        }),
      );

      const vm = scope.manage(runtime.newContext());
      this.injectContextGlobalVar(vm, scope, data);

      const logHandle = scope.manage(
        vm.newFunction('log', (...args) => {
          const nativeArgs = args.map((handle) =>
            vm.dump(scope.manage(handle)),
          );
          console.log('Sandbox:', ...nativeArgs);
        }),
      );
      const consoleHandle = scope.manage(vm.newObject());
      vm.setProp(consoleHandle, 'log', logHandle);
      vm.setProp(vm.global, 'console', consoleHandle);

      const result = vm.evalCode(code, '', {
        strict: true,
        type: 'global',
      });

      if (isPromise) {
        const resultHandle = scope.manage(vm.unwrapResult(result));
        const promise = resultHandle.consume((result) =>
          vm.resolvePromise(result),
        );
        vm.runtime.executePendingJobs();

        const asyncResult = await promise;
        if (asyncResult.error) {
          throw vm.dump(scope.manage(asyncResult.error));
        }

        return vm.dump(scope.manage(asyncResult.value));
      }

      if (result.error) {
        throw vm.dump(scope.manage(result.error));
      }

      return vm.dump(scope.manage(vm.unwrapResult(result)));
    });
  }

  mustacheTagRenderer({
    str,
    data,
    replacer,
  }: {
    str: string;
    data?: Record<PropertyKey, unknown>;
    replacer?(path: string, rawPath: string): string;
  }) {
    return str.replaceAll(MUSTACHE_REGEX, (tag) => {
      const path = tag.slice(2, -2).trim();
      if (replacer) return replacer(path, tag);

      const value = getProperty(data ?? {}, path, tag);
      return typeof value !== 'string' ? JSON.stringify(value) : value;
    });
  }

  async evaluateExpression<T extends Record<string, string>>(
    expression: T,
    options?: EvaluateExpressionOptions,
  ): Promise<Record<keyof T, unknown>>;
  async evaluateExpression(
    expression: string,
    options?: EvaluateExpressionOptions,
  ): Promise<unknown>;
  async evaluateExpression(
    expression: string | Record<string, string>,
    { data = {} }: EvaluateExpressionOptions = {},
  ) {
    const expRuntime = await this.getExpRuntime();
    const isMultipleExp = isObject(expression);

    const codeObj = isMultipleExp
      ? Object.fromEntries(
          Object.entries(expression).map(([key, str]) => [
            key,
            mustacheTemplateToCode(str),
          ]),
        )
      : { default: mustacheTemplateToCode(expression) };

    const evalResult = Scope.withScope((scope) => {
      const vm = scope.manage(expRuntime.newContext());
      this.injectContextGlobalVar(vm, scope, data);

      const renderedCode: Record<string, unknown> = {};
      for (const key in codeObj) {
        const result = vm.evalCode(codeObj[key]);
        if (result.error) {
          const error = vm.dump(scope.manage(result.error));
          throw error;
        }

        renderedCode[key] = vm.dump(scope.manage(result.value));
      }

      return renderedCode;
    });

    return isMultipleExp ? evalResult : evalResult.default;
  }

  async evaluateExpAndApply<T extends Record<string, any>>(
    expressionData: WorkflowNodeExpressionRecords,
    target: T,
    { filter }: { filter?: (key: string) => boolean } = {},
  ): Promise<{ isApplied: boolean; data: T }> {
    let isEmpty = true;

    const expression: Record<string, string> = {};
    Object.entries(expressionData).forEach(([key, value]) => {
      if (!value.active || (filter && !filter(key))) return;

      isEmpty = false;
      expression[key] = value.value;
    });

    if (isEmpty) return { isApplied: true, data: target };

    const result = await this.evaluateExpression(expression);
    Object.entries(result).forEach(([key, value]) => {
      setProperty(target, key, value);
    });

    return { isApplied: false, data: target };
  }

  destroy() {
    this._expRuntime?.dispose();
  }
}

export default WorkflowRunnerSandbox;
