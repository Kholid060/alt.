import { Module } from '@nestjs/common';
import { WebAppGateway } from './web-app.gateway';
import { WebAppService } from './web-app.service';

@Module({
  exports: [WebAppService],
  providers: [WebAppGateway, WebAppService],
})
export class WebAppModule {}
