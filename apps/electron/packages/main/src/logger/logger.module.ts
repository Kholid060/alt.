import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

@Global()
@Module({
  exports: [LoggerService],
  providers: [LoggerService],
})
export class LoggerModule {}
