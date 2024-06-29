import { Module } from '@nestjs/common';
import { DeepLinkService } from './deep-link.service';

@Module({
  exports: [DeepLinkService],
  providers: [DeepLinkService],
})
export class DeepLinkModule {}
