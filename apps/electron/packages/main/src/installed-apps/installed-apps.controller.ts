import { Controller } from '@nestjs/common';
import { InstalledAppsService } from './installed-apps.service';
import { IPCInvoke } from '../common/decorators/ipc.decorator';
import type { IPCInvokeReturn } from '#packages/common/interface/ipc-events.interface';

@Controller()
export class InstalledAppsController {
  constructor(private installedApps: InstalledAppsService) {}

  @IPCInvoke('installed-apps:get-list')
  getList(): IPCInvokeReturn<'installed-apps:get-list'> {
    return this.installedApps.getApps();
  }

  @IPCInvoke('installed-apps:get-browsers')
  getBrowsers(): IPCInvokeReturn<'installed-apps:get-browsers'> {
    return this.installedApps.getBrowsers();
  }
}
