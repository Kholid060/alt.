export declare namespace Runtime {
  interface Static {
    config: Config.Static;
    command: Command.Static;
    getManifest(): Promise<ExtensionManifest>;
  }
}

declare namespace Runtime.Command {
  interface LaunchOptions {
    name: string;
    args?: Record<string, unknown>;
  }
  type LaunchResult =
    | { success: true; result: unknown }
    | { success: false; errorMessage: string };

  interface UpdateDetailOptions {
    subtitle?: string | null;
  }

  interface Static {
    launch(options: LaunchOptions): Promise<LaunchResult>;
    updateDetail(options: UpdateDetailOptions): Promise<void>;
  }
}

declare namespace Runtime.Config {
  type ConfigType = 'extension' | 'command';

  interface Static {
    getValues<T extends object = Record<string, unknown>>(
      type?: ConfigType,
    ): Promise<T>;

    openConfigPage(config: ConfigType): Promise<void>;
  }
}
