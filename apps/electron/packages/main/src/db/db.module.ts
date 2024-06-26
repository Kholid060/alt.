import { Global, Module } from '@nestjs/common';
import { DBService } from './db.service';

@Global()
@Module({
  exports: [DBService],
  providers: [DBService],
})
export class DBModule {}
