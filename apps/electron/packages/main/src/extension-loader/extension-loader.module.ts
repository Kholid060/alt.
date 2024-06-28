import { Module } from '@nestjs/common';
import { ExtensionLoaderController } from './extension-loader.controller';
import { ExtensionLoaderService } from './extension-loader.service';
import { APIModule } from '../api/api.module';
import { ExtensionUpdaterModule } from '../extension-updater/extension-updater.module';
import { ExtensionSqliteModule } from '../extension/extension-sqlite/extension-sqlite.module';

@Module({
  exports: [ExtensionLoaderService],
  providers: [ExtensionLoaderService],
  controllers: [ExtensionLoaderController],
  imports: [ExtensionUpdaterModule, APIModule, ExtensionSqliteModule],
})
export class ExtensionLoaderModule {}
