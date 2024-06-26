import 'reflect-metadata';
import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  test(@Payload() payload: unknown) {
    console.log('test', payload, 'huh?', this);
    this.appService.test();
  }

  holaaaa() {
    console.log('test1');
  }
}
