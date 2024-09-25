import { ExtensionManifest } from '../../extension-manifest';

export declare namespace Runtime {
  type PlatformArch =
    | 'arm'
    | 'arm64'
    | 'ia32'
    | 'loong64'
    | 'mips'
    | 'mipsel'
    | 'ppc'
    | 'ppc64'
    | 'riscv64'
    | 's390'
    | 's390x'
    | 'x64';
  type PlatformOS =
    | 'aix'
    | 'android'
    | 'darwin'
    | 'freebsd'
    | 'haiku'
    | 'linux'
    | 'openbsd'
    | 'sunos'
    | 'win32'
    | 'cygwin'
    | 'netbsd';
  interface PlatformInfo {
    os: PlatformOS;
    arch: PlatformArch;
    appVersion: string;
  }

  interface Static {
    config: Config.Static;
    viewAction: ViewAction.Static;

    readonly platform: PlatformInfo;

    // @ext-api-value
    getFileThumbnailURL(filePath: string): string;

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
