import { Module } from '@nestjs/common';
import { ElectronApiService } from './electron-api.service';
import { ElectronApiController } from './electron-api.controller';

@Module({
  exports: [ElectronApiService],
  providers: [ElectronApiService],
  controllers: [ElectronApiController],
})
export class ElectronApiModule {}
