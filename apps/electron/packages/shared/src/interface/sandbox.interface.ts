export interface SandboxEvents {
  'evaluate-code': (
    code: string | Record<string, string>,
    context?: Record<PropertyKey, unknown>,
  ) => unknown | Record<string, string>;
}
