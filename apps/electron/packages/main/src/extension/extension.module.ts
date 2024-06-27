import { Module } from '@nestjs/common';
import { ExtensionController } from './extension.controller';
import { ExtensionConfigModule } from './extension-config/extension-config.module';
import { ExtensionQueryService, ExtensionService } from './extension.service';
import { ExtensionLoaderModule } from '../extension-loader/extension-loader.module';
import { BrowserExtensionModule } from '../browser-extension/browser-extension.module';
import { ExtensionCommandModule } from './extension-command/extension-command.module';

@Module({
  exports: [ExtensionService],
  controllers: [ExtensionController],
  providers: [ExtensionService, ExtensionQueryService],
  imports: [
    ExtensionLoaderModule,
    ExtensionConfigModule,
    ExtensionCommandModule,
    BrowserExtensionModule,
  ],
})
export class ExtensionModule {}
