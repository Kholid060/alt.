export class WorkflowRunnerNodeError extends Error {
  constructor(message?: string) {
    super(`[NodeError] ${message}`);
  }
}
