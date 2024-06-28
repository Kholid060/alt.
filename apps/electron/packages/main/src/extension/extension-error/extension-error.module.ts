import { Module } from '@nestjs/common';
import { ExtensionErrorController } from './extension-error.controller';
import { ExtensionErrorService } from './extension-error.service';

@Module({
  providers: [ExtensionErrorService],
  controllers: [ExtensionErrorController],
})
export class ExtensionErrorModule {}
