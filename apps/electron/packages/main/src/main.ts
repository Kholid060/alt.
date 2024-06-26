import { AppModule } from './app.module';
import ElectronLogger from './common/utils/ElectronLogger';
import ElectronNest from './ElectronNest';

async function bootstrap() {
  const electronNest = await ElectronNest.createApp(AppModule, {
    logger: new ElectronLogger(),
  });

  await electronNest.init();
}
bootstrap();
