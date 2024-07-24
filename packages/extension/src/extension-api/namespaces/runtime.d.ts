import { ExtensionManifest } from '../../extension-manifest';

export declare namespace Runtime {
  interface Static {
    config: Config.Static;
    command: Command.Static;

    // @ext-api-value
    getFileIconURL(filePath: string): string;

    getManifest(): Promise<ExtensionManifest>;
  }
}

export declare namespace Runtime.Command {
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

export declare namespace Runtime.Config {
  type ConfigType = 'extension' | 'command';

  interface Static {
    getValues<T extends object = Record<string, unknown>>(
      type?: ConfigType,
    ): Promise<T>;

    openConfigPage(config: ConfigType): Promise<void>;
  }
}
