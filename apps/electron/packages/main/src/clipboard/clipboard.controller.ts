import type {
  IPCInvokePayload,
  IPCInvokeReturn,
} from '#packages/common/interface/ipc-events.interface';
import { Injectable } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { clipboard } from 'electron';
import { IPCInvoke } from '../common/decorators/ipc.decorator';
import { ClipboardService } from './clipboard.service';

@Injectable()
export class ClipboardController {
  constructor(private clipboard: ClipboardService) {}

  @IPCInvoke('clipboard:read')
  clipboardRead(
    @Payload() [format]: IPCInvokePayload<'clipboard:read'>,
  ): IPCInvokeReturn<'clipboard:read'> {
    return Promise.resolve(this.clipboard.read(format));
  }

  @IPCInvoke('clipboard:copy')
  clipboardCopy(
    @Payload() [text]: IPCInvokePayload<'clipboard:copy'>,
  ): IPCInvokeReturn<'clipboard:copy'> {
    this.clipboard.write('text', text);
    return Promise.resolve();
  }

  @IPCInvoke('clipboard:paste')
  clipboardPaste(
    @Payload() [value]: IPCInvokePayload<'clipboard:paste'>,
  ): IPCInvokeReturn<'clipboard:paste'> {
    this.clipboard.paste(value);
    return Promise.resolve();
  }

  @IPCInvoke('clipboard:write')
  clipboardWrite(
    @Payload() [format, value]: IPCInvokePayload<'clipboard:write'>,
  ): IPCInvokeReturn<'clipboard:paste'> {
    this.clipboard.write(format, value);
    return Promise.resolve();
  }

  @IPCInvoke('clipboard:copy-buffer')
  clipboardCopyBuffer(
    @Payload()
    [contentType, content]: IPCInvokePayload<'clipboard:copy-buffer'>,
  ): IPCInvokeReturn<'clipboard:copy-buffer'> {
    clipboard.writeBuffer(contentType, Buffer.from(content));
    return Promise.resolve();
  }
}
