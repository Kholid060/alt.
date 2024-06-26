import { Module } from '@nestjs/common';
import { BrowserExtensionGateway } from './browser-extension.gateway';
import { BrowserExtensionService } from './browser-extension.service';

@Module({
  providers: [BrowserExtensionGateway, BrowserExtensionService],
})
export class BrowserExtensionModule {}
