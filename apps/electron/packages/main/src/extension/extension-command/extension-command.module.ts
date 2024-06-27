import { Module } from '@nestjs/common';
import { ExtensionCommandService } from './extension-command.service';
import { ExtensionCommandController } from './extension-command.controller';

@Module({
  exports: [ExtensionCommandService],
  providers: [ExtensionCommandService],
  controllers: [ExtensionCommandController],
})
export class ExtensionCommandModule {}
