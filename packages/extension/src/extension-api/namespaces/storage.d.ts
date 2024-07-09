/* eslint-disable @typescript-eslint/no-explicit-any */
export declare namespace Storage {
  type Values =
    | string
    | boolean
    | number
    | null
    | Record<string | number, any>
    | Array<any>;

  interface Static {
    get(key: string | string[]): Promise<Record<string, Values>>;

    getAll(): Promise<Record<string, Values>>;

    set(key: string, value: Values): Promise<void>;

    remove(key: string | string[]): Promise<void>;

    clear(): Promise<void>;
  }
}
