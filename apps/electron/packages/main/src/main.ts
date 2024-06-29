import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppModule } from './app.module';
import ElectronLogger from './common/utils/ElectronLogger';
import ElectronNest from './ElectronNest';
import { app } from 'electron';
import { APP_DEEP_LINK_SCHEME } from '@alt-dot/shared';

async function bootstrap() {
  const electronNest = await ElectronNest.createApp(AppModule, {
    logger: new ElectronLogger(),
  });

  const eventEmitter = electronNest.app.get(EventEmitter2);
  app.on('second-instance', (_event, commandLine) => {
    const deepLink = commandLine ? commandLine.pop() : null;
    if (!deepLink || !deepLink.startsWith(APP_DEEP_LINK_SCHEME)) {
      return;
    }

    eventEmitter.emit('deep-link', deepLink);
  });

  await electronNest.init();
}
bootstrap();
