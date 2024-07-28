import { Module } from '@nestjs/common';
import { BrowserExtensionGateway } from './browser-extension.gateway';
import { BrowserExtensionService } from './browser-extension.service';
import { BrowserExtensionActionService } from './browser-extension-action.service';
import { BrowserExtensionController } from './browser-extension.controller';

@Module({
  exports: [BrowserExtensionService],
  providers: [
    BrowserExtensionGateway,
    BrowserExtensionService,
    BrowserExtensionActionService,
  ],
  controllers: [BrowserExtensionController],
})
export class BrowserExtensionModule {}
