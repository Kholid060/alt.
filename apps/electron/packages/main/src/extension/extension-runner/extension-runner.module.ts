import { Module } from '@nestjs/common';
import { ClipboardModule } from '/@/clipboard/clipboard.module';
import { DBModule } from '/@/db/db.module';
import { ExtensionLoaderModule } from '/@/extension-loader/extension-loader.module';
import { ExtensionConfigModule } from '../extension-config/extension-config.module';
import { BrowserExtensionModule } from '/@/browser-extension/browser-extension.module';
import { ExtensionRunnerService } from './extension-runner.service';
import { ExtensionRunnerController } from './extension-runner.controller';

@Module({
  imports: [
    DBModule,
    ClipboardModule,
    ExtensionLoaderModule,
    ExtensionConfigModule,
    BrowserExtensionModule,
  ],
  exports: [ExtensionRunnerService],
  providers: [ExtensionRunnerService],
  controllers: [ExtensionRunnerController],
})
export class ExtensionRunnerModule {}
