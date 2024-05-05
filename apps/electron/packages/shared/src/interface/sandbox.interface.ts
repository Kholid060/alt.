export interface SandboxEvents {
  'evaluate-expression': (
    expression: string | Record<string, string>,
    context?: Record<PropertyKey, unknown>,
  ) => unknown | Record<string, string>;
}
