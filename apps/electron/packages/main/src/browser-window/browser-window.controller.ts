import { Controller } from '@nestjs/common';
import { BrowserWindowService } from './browser-window.service';
import { IPCInvoke, IPCSend } from '../common/decorators/ipc.decorator';
import { Ctx, Payload } from '@nestjs/microservices';
import type { IPCSendPayload } from '#packages/common/interface/ipc-events.interface';
import { WindowCommandService } from './service/window-command.service';

@Controller()
export class BrowserWindowController {
  constructor(
    private browserWindow: BrowserWindowService,
    private windowCommand: WindowCommandService,
  ) {}

  @IPCSend('dashboard-window:open')
  async openDashboardWindow(
    @Payload() [routePath]: IPCSendPayload<'dashboard-window:open'>,
  ) {
    await this.browserWindow.open('dashboard', routePath);
  }

  @IPCInvoke('command-window:show')
  async openCommandWindow() {
    const commandWindow = await this.browserWindow.get('command');
    await commandWindow.toggleWindow(true);
  }

  @IPCInvoke('command-window:close')
  async closeCommandWindow() {
    const commandWindow = await this.browserWindow.get('command', {
      autoCreate: false,
    });
    await commandWindow.toggleWindow(false);
  }

  @IPCSend('command-window:input-config')
  async openCommandWindowConfig(
    @Payload() [payload]: IPCSendPayload<'command-window:input-config'>,
  ) {
    await this.windowCommand.openInputConfig(payload);
  }

  @IPCSend('window:destroy')
  async destroyWindow(@Payload() [name]: IPCSendPayload<'window:destroy'>) {
    await this.browserWindow.destroy(name);
  }

  @IPCSend('window:toggle-lock')
  async toggleLockWindow(@Ctx() event: Electron.IpcMainEvent) {
    await this.browserWindow.toggleLock(event.sender);
  }
}
