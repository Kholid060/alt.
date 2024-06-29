import { Module } from '@nestjs/common';
import { AppBackupService } from './app-backup.service';
import { AppCryptoModule } from '../app-crypto/app-crypto.module';
import { ExtensionLoaderModule } from '/@/extension-loader/extension-loader.module';

@Module({
  exports: [AppBackupService],
  providers: [AppBackupService],
  imports: [AppCryptoModule, ExtensionLoaderModule],
})
export class AppBackupModule {}
