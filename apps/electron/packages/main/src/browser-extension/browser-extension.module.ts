import { Module } from '@nestjs/common';
import { BrowserExtensionGateway } from './browser-extension.gateway';
import { BrowserExtensionService } from './browser-extension.service';
import { BrowserExtensionActionService } from './browser-extension-action.service';

@Module({
  exports: [BrowserExtensionService],
  providers: [
    BrowserExtensionGateway,
    BrowserExtensionService,
    BrowserExtensionActionService,
  ],
})
export class BrowserExtensionModule {}
