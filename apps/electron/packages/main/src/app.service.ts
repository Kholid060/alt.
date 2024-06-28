import os from 'os';
import { app } from 'electron';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() {}

  getVersion() {
    return {
      $isError: false,
      app: app.getVersion(),
      os: `${process.platform}@${os.release()}`,
    };
  }
}
