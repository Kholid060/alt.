import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() {
    console.log('app service');
  }

  test() {
    console.log('hello service');
  }
}
