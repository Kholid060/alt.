/* eslint-disable @typescript-eslint/no-explicit-any */

export declare namespace Clipboard {
  type ClipboardContentType = 'html' | 'text' | 'image' | 'rtf';

  interface Static {
    read(format: ClipboardContentType): Promise<string>;

    write(format: ClipboardContentType, value: string): Promise<void>;

    paste(value: any): Promise<void>;
  }
}
