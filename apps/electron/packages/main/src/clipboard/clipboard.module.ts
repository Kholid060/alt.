import { Module } from '@nestjs/common';
import { ClipboardService } from './clipboard.service';
import { ClipboardController } from './clipboard.controller';

@Module({
  exports: [ClipboardService],
  providers: [ClipboardService],
  controllers: [ClipboardController],
})
export class ClipboardModule {}
