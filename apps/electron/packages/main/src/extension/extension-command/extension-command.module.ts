import { Module } from '@nestjs/common';
import { ExtensionCommandService } from './extension-command.service';
import { ExtensionCommandController } from './extension-command.controller';
import { ExtensionRunnerModule } from '../extension-runner/extension-runner.module';

@Module({
  imports: [ExtensionRunnerModule],
  exports: [ExtensionCommandService],
  providers: [ExtensionCommandService],
  controllers: [ExtensionCommandController],
})
export class ExtensionCommandModule {}
