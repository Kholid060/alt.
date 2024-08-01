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

export declare namespace Runtime.Config {
  type ConfigType = 'extension' | 'command';

  interface Static {
    getValues<T extends object = Record<string, unknown>>(
      type?: ConfigType,
    ): Promise<T>;

    openConfigPage(config: ConfigType): Promise<void>;
  }
}
