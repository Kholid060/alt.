import { Global, Module } from '@nestjs/common';
import { AppStoreService } from './app-store.service';
import { BrowserWindowModule } from '/@/browser-window/browser-window.module';

@Global()
@Module({
  exports: [AppStoreService],
  providers: [AppStoreService],
  imports: [BrowserWindowModule],
})
export class AppStoreModule {}
