import { LoggerService } from '@nestjs/common';
import log from 'electron-log/main';

class ElectronLogger implements LoggerService {
  log(...args: unknown[]) {
    log.log(...args);
  }

  info(...args: unknown[]) {
    log.info(...args);
  }

  silly(...args: unknown[]) {
    log.silly(...args);
  }

  error(...args: unknown[]) {
    log.error(...args);
  }

  warn(...args: unknown[]) {
    log.warn(...args);
  }

  debug(...args: unknown[]) {
    log.debug(...args);
  }

  verbose(...args: unknown[]) {
    log.verbose(...args);
  }
}

export default ElectronLogger;
