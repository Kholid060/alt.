interface WorkflowRunnerLoopData {
  index: number;
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
  variables: StorageData;
  loopData: StorageData<WorkflowRunnerLoopData>;

  constructor() {
    this.loopData = new StorageData();
    this.variables = new StorageData();
  }

  getContextData() {
    return {
      looping: this.loopData.getAll(),
      variables: this.variables.getAll(),
    };
  }

  destroy() {
    this.loopData.clear();
    this.variables.clear();
  }
}

export default WorkflowRunnerData;
