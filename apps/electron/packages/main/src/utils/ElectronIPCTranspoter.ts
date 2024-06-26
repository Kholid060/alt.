import type { CustomTransportStrategy } from '@nestjs/microservices';
import { Server } from '@nestjs/microservices';
import { ipcMain } from 'electron';

class ElectronIPCTransporter extends Server implements CustomTransportStrategy {
  listen(callback: (...optionalParams: unknown[]) => unknown) {
    this.getHandlers().forEach((callback, channel) => {
      switch (callback.extras?.type) {
        case 'invoke':
          ipcMain.handle(channel, (event, ...args) => {
            return callback(args, event);
          });
          break;
        case 'send':
          ipcMain.on(channel, (event, ...args) => {
            callback(args, event);
          });
          break;
      }
    });
    callback();
  }

  close() {
    ipcMain.removeAllListeners();
  }
}

export default ElectronIPCTransporter;
