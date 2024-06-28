import { Global, Module } from '@nestjs/common';
import { InstalledAppsService } from './installed-apps.service';
import { InstalledAppsController } from './installed-apps.controller';

@Global()
@Module({
  exports: [InstalledAppsService],
  providers: [InstalledAppsService],
  controllers: [InstalledAppsController],
})
export class InstalledAppsModule {}
