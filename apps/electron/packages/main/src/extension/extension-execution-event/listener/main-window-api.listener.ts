import { Injectable } from '@nestjs/common';
import { OnExtensionAPI } from '/@/common/decorators/extension.decorator';
import { sleep } from '@alt-dot/shared';
import { BrowserWindowService } from '/@/browser-window/browser-window.service';
import { ExtensionApiEvent } from '../events/extension-api.event';

@Injectable()
export class ExtensionMainWindowApiListener {
  constructor(private browserWindow: BrowserWindowService) {}

  @OnExtensionAPI('mainWindow.close')
  async close(_event: ExtensionApiEvent<'mainWindow.close'>) {
    const windowCommand = await this.browserWindow.get('command', {
      noThrow: true,
      autoCreate: false,
    });
    if (!windowCommand) return;

    await windowCommand.toggleWindow(false);
    await sleep(1000);
  }
}
