import { Module } from '@nestjs/common';
import { CustomProtocolService } from './custom-protocol.service';
import { CustomProtocolController } from './custom-protocol.controller';
import { ExtensionLoaderModule } from '../extension-loader/extension-loader.module';

@Module({
  imports: [ExtensionLoaderModule],
  providers: [CustomProtocolService],
  controllers: [CustomProtocolController],
})
export class CustomProtocolModule {}
