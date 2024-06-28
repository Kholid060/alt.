import { Module } from '@nestjs/common';
import { ExtensionSqliteService } from './extension-sqlite.service';

@Module({
  exports: [ExtensionSqliteService],
  providers: [ExtensionSqliteService],
})
export class ExtensionSqliteModule {}
