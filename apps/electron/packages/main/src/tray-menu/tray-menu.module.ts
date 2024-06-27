import { Global, Module } from '@nestjs/common';
import { TrayMenuService } from './tray-menu.service';

@Global()
@Module({
  exports: [TrayMenuService],
  providers: [TrayMenuService],
})
export class TrayMenuModule {}
