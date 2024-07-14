import { Injectable } from '@nestjs/common';
import ElectronLogger, { LogParams } from '../common/utils/ElectronLogger';
import { Level } from 'pino';

@Injectable()
export class LoggerService extends ElectronLogger {
  devOnly(level: Level, ...args: LogParams) {
    if (!import.meta.env.DEV) return;
    this[level](...args);
  }

  async wrap(location: string[], func: () => unknown) {
    try {
      await func();
    } catch (error) {
      this.error(location, error);
    }
  }
}
