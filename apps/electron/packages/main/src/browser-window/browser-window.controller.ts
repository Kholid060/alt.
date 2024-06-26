import { Controller } from '@nestjs/common';
import { BrowserWindowService } from './browser-window.service';
import { IPCSend } from '../common/decorators/ipc.decorator';
import { Payload } from '@nestjs/microservices';
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

  @IPCSend('command-window:open')
  async openCommandWindow(
    @Payload() [routePath]: IPCSendPayload<'command-window:open'>,
  ) {
    await this.browserWindow.open('command', routePath);
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
}
