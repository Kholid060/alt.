import type { CustomTransportStrategy } from '@nestjs/microservices';
import { Server } from '@nestjs/microservices';
import { ipcMain, protocol } from 'electron';

type SchemePrivilege = {
  scheme: string;
  priveleges: Required<Electron.CustomScheme>['privileges'];
};

class ElectronIPCTransporter extends Server implements CustomTransportStrategy {
  listen(callback: (...optionalParams: unknown[]) => unknown) {
    const privileges: SchemePrivilege[] = [];
    this.getHandlers().forEach((callback, channel) => {
      switch (callback.extras?.type) {
        case 'ipc:invoke':
          ipcMain.handle(channel, (event, ...args) => {
            return callback(args, event);
          });
          break;
        case 'ipc:send':
          ipcMain.on(channel, (event, ...args) => {
            callback(args, event);
          });
          break;
        case 'protocol:custom': {
          if (callback.extras.options?.privilege) {
            privileges.push({
              scheme: channel,
              priveleges: callback.extras.options.privilege,
            });
          }
          break;
        }
      }
    });

    protocol.registerSchemesAsPrivileged(privileges);

    callback();
  }

  onAppReady() {
    this.getHandlers().forEach((callback, scheme) => {
      switch (callback.extras?.type) {
        case 'protocol:custom':
          protocol.handle(
            scheme,
            // @ts-expect-error force!!!
            (req) => callback([req]),
          );
          break;
      }
    });
  }

  close() {
    ipcMain.removeAllListeners();
  }
}

export default ElectronIPCTransporter;
