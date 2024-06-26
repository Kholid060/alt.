import { Module } from '@nestjs/common';
import { ExtensionUpdaterService } from './extension-updater.service';
import { APIModule } from '../api/api.module';

@Module({
  imports: [APIModule],
  exports: [ExtensionUpdaterService],
  providers: [ExtensionUpdaterService],
})
export class ExtensionUpdaterModule {}
