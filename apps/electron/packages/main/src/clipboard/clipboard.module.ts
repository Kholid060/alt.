import { Module } from '@nestjs/common';
import { ClipboardService } from './clipboard.service';

@Module({
  exports: [ClipboardService],
  providers: [ClipboardService],
  controllers: [ClipboardModule],
})
export class ClipboardModule {}
