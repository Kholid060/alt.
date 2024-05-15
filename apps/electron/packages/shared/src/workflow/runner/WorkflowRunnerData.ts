interface WorkflowRunnerLoopData {
  index: number;
  label?: string;
  data: unknown[];
}

class StorageData<T = unknown> {
  private _data: Record<PropertyKey, T> = {};

  set(key: PropertyKey, value: T) {
    this._data[key] = value;
  }

  get<P = T>(key: PropertyKey) {
    return (this._data[key] ?? null) as P | null;
  }

  has(key: PropertyKey): boolean {
    return Object.hasOwn(this._data, key);
  }

  delete(key: PropertyKey) {
    delete this._data[key];
  }

  getAll() {
    return this._data;
  }

  clear() {
    this._data = {};
  }
}

class WorkflowRunnerData {
  private _prevNodeData: unknown = null;

  variables: StorageData;
  loopData: StorageData<WorkflowRunnerLoopData>;

  constructor() {
    this._prevNodeData = null;
    this.loopData = new StorageData();
    this.variables = new StorageData();
  }

  get prevNodeData() {
    return this._prevNodeData;
  }

  get contextData() {
    return {
      prevNode: this.prevNodeData,
      vars: this.variables.getAll(),
      loopData: this.loopData.getAll(),
    };
  }

  setPrevNodeData(data: unknown) {
    this._prevNodeData = data;
  }

  destroy() {
    this.loopData.clear();
    this.variables.clear();
    this._prevNodeData = null;
  }
}

export default WorkflowRunnerData;
