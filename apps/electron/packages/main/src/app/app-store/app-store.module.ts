import { Global, Module } from '@nestjs/common';
import { AppStoreService } from './app-store.service';

@Global()
@Module({
  exports: [AppStoreService],
  providers: [AppStoreService],
})
export class AppStoreModule {}
