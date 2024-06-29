import { Injectable } from '@nestjs/common';
import { DeepLinkService } from './deep-link.service';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class DeepLinkListener {
  constructor(private deepLink: DeepLinkService) {}

  @OnEvent('deep-link')
  handleDeepLink(url: string) {
    console.log('deeplink', url);
  }
}
