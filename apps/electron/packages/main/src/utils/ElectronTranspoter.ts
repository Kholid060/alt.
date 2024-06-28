/* eslint-disable drizzle/enforce-delete-with-where */
import type { CustomTransportStrategy } from '@nestjs/microservices';
import { Server } from '@nestjs/microservices';
import { ipcMain, protocol } from 'electron';

type SchemePrivilege = {
  scheme: string;
  priveleges: Required<Electron.CustomScheme>['privileges'];
};

class ElectronTransporter extends Server implements CustomTransportStrategy {
  listen(callback: (...optionalParams: unknown[]) => unknown) {
    const privileges: SchemePrivilege[] = [];
    this.messageHandlers.forEach((callback, channel) => {
      switch (callback.extras?.type) {
        case 'ipc:invoke':
          ipcMain.handle(channel, (event, ...args) => {
            return callback(args, event);
          });
          this.messageHandlers.delete(channel);
          break;
        case 'ipc:send':
          ipcMain.on(channel, (event, ...args) => {
            callback(args, event);
          });
          this.messageHandlers.delete(channel);
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
    this.messageHandlers.forEach((callback, scheme) => {
      switch (callback.extras?.type) {
        case 'protocol:custom':
          protocol.handle(
            scheme,
            // @ts-expect-error force!!!
            (req) => callback([req]),
          );
          this.messageHandlers.delete(scheme);
          break;
      }
    });
  }

  close() {
    ipcMain.removeAllListeners();
  }
}

export default ElectronTransporter;
