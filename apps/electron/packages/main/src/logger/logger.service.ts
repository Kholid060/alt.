import { Injectable } from '@nestjs/common';
import ElectronLogger from '../common/utils/ElectronLogger';
import { LogLevel } from 'electron-log';

@Injectable()
export class LoggerService extends ElectronLogger {
  devOnly(level: LogLevel, ...args: unknown[]) {
    if (!import.meta.env.DEV) return;
    this[level](...args);
  }
}
