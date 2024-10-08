import type {
  IPCInvokePayload,
  IPCInvokeReturn,
  IPCSendPayload,
} from '#packages/common/interface/ipc-events.interface';
import { Controller } from '@nestjs/common';
import { Ctx, Payload } from '@nestjs/microservices';
import {
  BrowserWindow,
  Notification,
  clipboard,
  dialog,
  shell,
} from 'electron';
import { IPCInvoke, IPCSend } from '../common/decorators/ipc.decorator';
import { ElectronApiService } from './electron-api.service';

@Controller()
export class ElectronApiController {
  constructor(private electronApi: ElectronApiService) {}

  @IPCInvoke('shell:open-path')
  shellOpenPath(
    @Payload() [path]: IPCInvokePayload<'shell:open-path'>,
  ): IPCInvokeReturn<'shell:open-path'> {
    shell.openPath(path);
    return Promise.resolve();
  }

  @IPCInvoke('shell:open-url')
  shellOpenUrl(
    @Payload() [url]: IPCInvokePayload<'shell:open-url'>,
  ): IPCInvokeReturn<'shell:open-url'> {
    shell.openExternal(url);
    return Promise.resolve();
  }

  @IPCInvoke('shell:open-in-folder')
  shellOpenInFolder(
    @Payload() [filePath]: IPCInvokePayload<'shell:open-in-folder'>,
  ): IPCInvokeReturn<'shell:open-in-folder'> {
    shell.showItemInFolder(filePath);
    return Promise.resolve();
  }

  @IPCInvoke('shell:move-to-trash')
  shellMoveToTrash(
    @Payload() [filePath]: IPCInvokePayload<'shell:move-to-trash'>,
  ): IPCInvokeReturn<'shell:move-to-trash'> {
    return shell.trashItem(filePath);
  }

  @IPCInvoke('clipboard:read-buffer')
  clipboardReadBuffer(
    @Payload()
    [contentType]: IPCInvokePayload<'clipboard:read-buffer'>,
  ): IPCInvokeReturn<'clipboard:read-buffer'> {
    const buffer = clipboard.readBuffer(contentType);
    return Promise.resolve(buffer.toString());
  }

  @IPCInvoke('clipboard:has-buffer')
  clipboardHasBuffer(
    @Payload()
    [contentType]: IPCInvokePayload<'clipboard:has-buffer'>,
  ): IPCInvokeReturn<'clipboard:has-buffer'> {
    return Promise.resolve(clipboard.has(contentType));
  }

  @IPCInvoke('dialog:open')
  dialogOpen(
    @Ctx() { sender }: Electron.IpcMainInvokeEvent,
    @Payload()
    [options]: IPCInvokePayload<'dialog:open'>,
  ): IPCInvokeReturn<'dialog:open'> {
    return this.electronApi.openDialog(
      options,
      BrowserWindow.fromWebContents(sender),
    );
  }

  @IPCInvoke('dialog:message-box')
  dialogMessageBox(
    @Payload()
    [options]: IPCInvokePayload<'dialog:message-box'>,
  ): IPCInvokeReturn<'dialog:message-box'> {
    return dialog.showMessageBox(options);
  }

  @IPCSend('notification:show')
  notificationShow(
    @Payload()
    [{ title, body, silent }]: IPCSendPayload<'notification:show'>,
  ) {
    const notification = new Notification({
      body,
      silent,
      title,
    });
    notification.show();
  }
}
