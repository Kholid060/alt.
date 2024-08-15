import { isObject } from '@altdot/shared';
import type WorkflowRunner from './WorkflowRunner';
import WorkflowFileHandle from '../utils/WorkflowFileHandle';
import { WORKFLOW_NODE_TYPE, WorkflowVariableMode } from '@altdot/workflow';

interface WorkflowRunnerLoopData {
  index: number;
  nodeId: string;
  data: unknown[];
  currentData: unknown;
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

class WorkflowVariable extends StorageData {
  constructor() {
    super({});
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private appendValue(valA: any, valB: any) {
    if (Array.isArray(valA)) {
      return [...valA, valB];
    } else if (isObject(valA) && isObject(valB)) {
      return { ...valA, ...valB };
    } else if (WorkflowFileHandle.isWorkflowFileHandle(valB)) {
      return valB;
    }

    return valA + valB;
  }

  setVariable(
    key: string | number,
    value: unknown,
    mode: WorkflowVariableMode = 'replace',
  ) {
    let newValue: unknown;

    switch (mode) {
      case 'append':
        newValue = this.has(key)
          ? this.appendValue(this.get(key), value)
          : value;
        break;
      case 'replace':
        newValue = value;
        break;
      default:
        throw new Error('Unsupported variable mode');
    }

    this.set(key, newValue);

    return newValue;
  }
}

type NodeData = {
  prevNode: { id: string; value: unknown } | null;
  currentNode: { id: string; type: WORKFLOW_NODE_TYPE } | null;
};

class WorkflowRunnerData {
  variables: WorkflowVariable;
  nodeData: StorageData<NodeData>;
  loopData: StorageData<Record<string, WorkflowRunnerLoopData>>;

  constructor(private runner: WorkflowRunner) {
    this.loopData = new StorageData({});
    this.variables = new WorkflowVariable();

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
