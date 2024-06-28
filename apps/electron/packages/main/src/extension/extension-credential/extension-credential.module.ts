import { Module } from '@nestjs/common';
import { ExtensionCredentialController } from './extension-credential.controller';
import { ExtensionCredentialService } from './extension-credential.service';

@Module({
  exports: [ExtensionCredentialService],
  providers: [ExtensionCredentialService],
  controllers: [ExtensionCredentialController],
})
export class ExtensionCredentialModule {}
