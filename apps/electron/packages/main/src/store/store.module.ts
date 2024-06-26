import { Global, Module } from '@nestjs/common';
import { StoreService } from './store.service';

@Global()
@Module({
  imports: [StoreModule],
  exports: [StoreService],
  providers: [StoreService],
})
export class StoreModule {}
