import { Module } from '@nestjs/common';
import { ExtensionConfigController } from './extension-config.controller';
import { ExtensionConfigService } from './extension-config.service';

@Module({
  exports: [ExtensionConfigService],
  controllers: [ExtensionConfigController],
  providers: [ExtensionConfigService],
})
export class ExtensionConfigModule {}
