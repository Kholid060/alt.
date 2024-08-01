export declare namespace ChildProcess {
  interface ExecOptions {
    cwd?: string;
    timeout?: number;
    encoding?: string;
    maxBuffer?: number;
    killSignal?: string;
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
      args: unknown[],
      options?: ExecOptions,
    ): Promise<ExecResult<O, E>>;
  }
}
