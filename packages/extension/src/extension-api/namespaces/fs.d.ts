/* eslint-disable @typescript-eslint/no-explicit-any */
export declare namespace Fs {
  interface WriteOptions {
    encoding: string;
    stringType: 'base64';
  }
  interface ReadOptions {
    encoding: string;
  }

  interface Stats {
    size: number;
    atime: string;
    mtime: string;
    isFile: boolean;
    birthtime: string;
    isDirectory: boolean;
  }

  interface Static {
    stat(path: string): Promise<Stats>;

    readJSON(path: string): Promise<Record<any, any>>;

    exists(path: string): Promise<boolean>;

    readFile(
      path: string,
      options?: Partial<ReadOptions>,
    ): Promise<Uint8Array | string>;

    writeFile(
      path: string,
      data: string | Uint8Array,
      options?: Partial<WriteOptions>,
    ): Promise<void>;

    appendFile(
      path: string,
      data: string | Uint8Array,
      options?: Partial<WriteOptions>,
    ): Promise<void>;
  }
}
