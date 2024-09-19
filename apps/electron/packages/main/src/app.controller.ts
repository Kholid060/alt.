import 'reflect-metadata';
import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { IPCInvoke, IPCSend } from './common/decorators/ipc.decorator';
import type {
  IPCInvokePayload,
  IPCInvokeReturn,
  IPCSendPayload,
} from '#packages/common/interface/ipc-events.interface';
import { Ctx, Payload } from '@nestjs/microservices';
import { AppBackupService } from './app/app-backup/app-backup.service';
import { BrowserWindow } from 'electron';
import { AppStoreService } from './app/app-store/app-store.service';
import { AppCryptoService } from './app/app-crypto/app-crypto.service';

@Controller()
export class AppController {
  constructor(
    private appService: AppService,
    private appStore: AppStoreService,
    private appBackup: AppBackupService,
    private appCrypto: AppCryptoService,
  ) {}

  @IPCInvoke('app:versions')
  getVersions(): IPCInvokeReturn<'app:versions'> {
    return Promise.resolve(this.appService.getVersion());
  }

  @IPCInvoke('app:open-devtools')
  openDevtools(
    @Ctx() event: Electron.IpcMainInvokeEvent,
  ): IPCInvokeReturn<'app:open-devtools'> {
    event.sender.openDevTools();
    return Promise.resolve();
  }

  @IPCInvoke('app:get-settings')
  getSettings(
    @Payload() [key]: IPCInvokePayload<'app:get-settings'>,
  ): IPCInvokeReturn<'app:get-settings'> {
    return this.appStore.getSettings(
      key,
    ) as unknown as IPCInvokeReturn<'app:get-settings'>;
  }

  @IPCInvoke('app:set-settings')
  setSettings(
    @Payload() [settings]: IPCInvokePayload<'app:set-settings'>,
  ): IPCInvokeReturn<'app:set-settings'> {
    this.appStore.setSettings(settings);
    return Promise.resolve();
  }

  @IPCInvoke('app:backup-data')
  backupData(
    @Ctx() { sender }: Electron.IpcMainInvokeEvent,
  ): IPCInvokeReturn<'app:backup-data'> {
    return this.appBackup.backupDataToFile(
      BrowserWindow.fromWebContents(sender),
    );
  }

  @IPCInvoke('app:restore-data')
  restoreBackupData(
    @Ctx() { sender }: Electron.IpcMainInvokeEvent,
  ): IPCInvokeReturn<'app:restore-data'> {
    return this.appBackup.restoreBackupFromFile(
      BrowserWindow.fromWebContents(sender),
    );
  }

  @IPCInvoke('crypto:create-hash')
  cryptoCreateHash(
    @Payload() [algo, data, options]: IPCInvokePayload<'crypto:create-hash'>,
  ): IPCInvokeReturn<'crypto:create-hash'> {
    return Promise.resolve(this.appCrypto.createHash(algo, data, options));
  }

  @IPCSend('app:message-port-bridge')
  messagePortBridge(
    @Ctx() { ports }: Electron.IpcMainEvent,
    @Payload() [payload]: IPCSendPayload<'app:message-port-bridge'>,
  ) {
    this.appService.messagePortBridge(
      ports,
      payload.channelId,
      payload.options,
    );
  }
}
