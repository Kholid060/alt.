import type { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/workflow.const';
import type WorkflowRunner from './WorkflowRunner';

interface WorkflowRunnerLoopData {
  index: number;
  label?: string;
  data: unknown[];
}

class StorageData<
  T extends Record<string | number, unknown> = Record<string | number, unknown>,
> {
  private _data: T;

  initialData: T;

  constructor(defaultData: T) {
    this._data = defaultData;
    this.initialData = defaultData;
  }

  set<K extends keyof T>(key: K, value: T[K]) {
    this._data[key] = value;
  }

  get<K extends keyof T, P = T[K]>(key: K) {
    return (this._data[key] ?? null) as P | null;
  }

  has<K extends keyof T>(key: K): boolean {
    return Object.hasOwn(this._data, key);
  }

  delete<K extends keyof T>(key: K) {
    delete this._data[key];
  }

  getAll() {
    return this._data;
  }

  clear() {
    this._data = this.initialData;
  }
}

type NodeData = {
  prevNode: { id: string; value: unknown } | null;
  currentNode: { id: string; type: WORKFLOW_NODE_TYPE } | null;
};

class WorkflowRunnerData {
  variables: StorageData;
  nodeData: StorageData<NodeData>;
  loopData: StorageData<Record<string, WorkflowRunnerLoopData>>;

  constructor(private runner: WorkflowRunner) {
    this.loopData = new StorageData({});
    this.variables = new StorageData({});

    this.nodeData = new StorageData({
      prevNode: null,
      currentNode: null,
    });
  }

  get contextData() {
    return {
      vars: this.variables.getAll(),
      loopData: this.loopData.getAll(),
      parentWorkflow: this.runner.parentWorkflow,
      prevNode: this.nodeData.get('prevNode')?.value ?? null,
    };
  }

  destroy() {
    this.loopData.clear();
    this.nodeData.clear();
    this.variables.clear();
  }
}

export default WorkflowRunnerData;
