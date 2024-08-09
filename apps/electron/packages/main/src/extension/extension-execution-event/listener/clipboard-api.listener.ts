import { Injectable } from '@nestjs/common';
import { OnExtensionAPI } from '/@/common/decorators/extension.decorator';
import { ExtensionApiEvent } from '../events/extension-api.event';
import { ClipboardService } from '/@/clipboard/clipboard.service';

@Injectable()
export class ExtensionClipboardApiListener {
  constructor(private clipboard: ClipboardService) {}

  @OnExtensionAPI('clipboard.read')
  async clipboardRead({ args: [format] }: ExtensionApiEvent<'clipboard.read'>) {
    return this.clipboard.read(format);
  }

  @OnExtensionAPI('clipboard.write')
  clipboardWrite({
    args: [format, value],
  }: ExtensionApiEvent<'clipboard.write'>) {
    this.clipboard.write(format, value);
    return Promise.resolve();
  }

  @OnExtensionAPI('clipboard.paste')
  async clipboardPaste({
    args: [value],
  }: ExtensionApiEvent<'clipboard.paste'>) {
    await this.clipboard.paste(value, true);
  }
}
