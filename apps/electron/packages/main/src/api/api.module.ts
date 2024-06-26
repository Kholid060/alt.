import { Module } from '@nestjs/common';
import { APIService } from './api.service';

@Module({
  exports: [APIService],
  providers: [APIService],
})
export class APIModule {}
