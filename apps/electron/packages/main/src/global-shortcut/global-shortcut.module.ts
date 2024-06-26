import { Global, Module } from '@nestjs/common';
import { GlobalShortcutService } from './global-shortcut.service';

@Global()
@Module({
  exports: [GlobalShortcutService],
  providers: [GlobalShortcutService],
})
export class GlobalShortcutModule {}
