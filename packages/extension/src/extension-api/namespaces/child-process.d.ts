export declare namespace ChildProcess {
  interface ExecOptions {
    cwd?: string;
    timeout?: number;
    encoding?: string;
    maxBuffer?: number;
    shell?: string | boolean;
    env?: Record<PropertyKey, unknown>;
  }

  interface ExecResult<T = unknown, P = unknown> {
    stdout: T;
    stderr: P;
  }

  interface Static {
    exec<O, E>(
      command: string,
      options?: ExecOptions,
    ): Promise<ExecResult<O, E>>;
  }
}
