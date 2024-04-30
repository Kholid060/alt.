class WorkflowRunnerData {
  private _variables: Record<string, unknown> = {};

  constructor() {}

  setVariable(key: string, value: unknown) {
    this._variables[key] = value;
  }
}

export default WorkflowRunnerData;
