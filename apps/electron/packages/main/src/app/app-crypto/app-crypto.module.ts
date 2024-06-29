import { Module } from '@nestjs/common';
import { AppCryptoService } from './app-crypto.service';

@Module({
  exports: [AppCryptoService],
  providers: [AppCryptoService],
})
export class AppCryptoModule {}
