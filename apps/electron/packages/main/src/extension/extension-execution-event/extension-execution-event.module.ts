import { Module } from '@nestjs/common';
import { ExtensionExecutionEventController } from './extension-execution-event.controller';
import { ExtensionExecutionEventService } from './extension-execution-event.service';
import { InstalledAppsModule } from '/@/installed-apps/installed-apps.module';
import { ExtensionQueryService } from '../extension-query.service';

@Module({
  imports: [InstalledAppsModule],
  controllers: [ExtensionExecutionEventController],
  providers: [ExtensionExecutionEventService, ExtensionQueryService],
})
export class ExtensionExecutionEventModule {}
