export declare namespace Command {
  interface LaunchOptions {
    name: string;
    args?: Record<string, unknown>;
    captureAllScriptMessages?: boolean;
  }
  type LaunchResult<T = unknown> =
    | { success: true; result: T }
    | { success: false; errorMessage: string };

  interface UpdateDetailOptions {
    subtitle?: string | null;
  }

  interface Static {
    updateDetail(options: UpdateDetailOptions): Promise<void>;
    launch<T = unknown>(options: LaunchOptions): Promise<LaunchResult<T>>;
  }
}
