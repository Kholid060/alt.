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

  @IPCInvoke('clipboard:copy')
  clipboardCopy(
    @Payload() [text]: IPCInvokePayload<'clipboard:copy'>,
  ): IPCInvokeReturn<'clipboard:copy'> {
    this.clipboard.write('text', text);
    return Promise.resolve();
  }

  @IPCInvoke('clipboard:paste')
  clipboardPaste(): IPCInvokeReturn<'clipboard:paste'> {
    this.clipboard.paste();
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
