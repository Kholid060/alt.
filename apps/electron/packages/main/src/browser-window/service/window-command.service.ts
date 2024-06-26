import { Injectable } from '@nestjs/common';
import { BrowserWindowService } from '../browser-window.service';
import { IPCSendPayload } from '#packages/common/interface/ipc-events.interface';

@Injectable()
export class WindowCommandService {
  constructor(private browserWindow: BrowserWindowService) {}

  async openInputConfig(
    payload: IPCSendPayload<'command-window:input-config'>[0],
  ) {
    const commandWindow = await this.browserWindow.get('command');
    commandWindow.toggleWindow(true);
    commandWindow.sendMessage('command-window:input-config', payload);
  }
}
