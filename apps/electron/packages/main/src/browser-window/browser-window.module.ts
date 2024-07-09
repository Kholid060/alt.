import { Global, Module } from '@nestjs/common';
import { BrowserWindowService } from './browser-window.service';
import { BrowserWindowController } from './browser-window.controller';
import { WindowCommandService } from './service/window-command.service';

@Global()
@Module({
  exports: [BrowserWindowService],
  controllers: [BrowserWindowController],
  providers: [BrowserWindowService, WindowCommandService],
})
export class BrowserWindowModule {}