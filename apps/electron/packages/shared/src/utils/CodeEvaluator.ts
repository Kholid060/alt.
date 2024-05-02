import { QuickJSWASMModule, getQuickJS } from 'quickjs-emscripten';

class CodeEvaluator {
  private runtime: QuickJSWASMModule;

  constructor({ initImmediate = false }: { initImmediate?: boolean }) {

  }

  async private initRuntime() {
    getQuickJS();
  }

  async evaluate() {

  }
}

export default CodeEvaluator;
