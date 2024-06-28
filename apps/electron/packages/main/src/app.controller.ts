import 'reflect-metadata';
import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { IPCInvoke } from './common/decorators/ipc.decorator';
import type { IPCInvokeReturn } from '#packages/common/interface/ipc-events.interface';
import { Ctx } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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
}
