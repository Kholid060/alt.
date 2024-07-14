import { LoggerService, OnModuleInit } from '@nestjs/common';
import path from 'path';
import dayjs from 'dayjs';
import fs from 'fs-extra';
import { Logger, pino } from 'pino';
import { APP_LOGS_DIR } from './constant';
import { app } from 'electron';

const LOG_DATE_FORMAT = 'YYYY-MM-DD';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LogParams = [any, ...any[]];

const date = dayjs().format(LOG_DATE_FORMAT);

class ElectronLogger implements LoggerService, OnModuleInit {
  static _instance: ElectronLogger = new ElectronLogger();

  private pino: Logger;

  constructor() {
    this.pino = pino(
      {
        formatters: {
          bindings(bindings) {
            return { ...bindings, appVersion: app.getVersion() };
          },
          level(label) {
            return { level: label };
          },
        },
        transport: import.meta.env.DEV
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
              },
            }
          : undefined,
      },
      pino.destination({
        dest: path.join(APP_LOGS_DIR, `main-${date}.log`),
      }),
    );
  }

  onModuleInit() {
    const past14DaysLog = dayjs().subtract(14, 'days').format(LOG_DATE_FORMAT);
    fs.remove(`main-${past14DaysLog}.log`).catch(() => {
      // Do nothing
    });
  }

  log(...args: LogParams) {
    this.pino.info(...args);
  }

  info(...args: LogParams) {
    this.pino.info(...args);
  }

  error(...args: LogParams) {
    this.pino.error(...args);
  }

  warn(...args: LogParams) {
    this.pino.warn(...args);
  }

  debug(...args: LogParams) {
    this.pino.debug(...args);
  }

  fatal(...args: LogParams) {
    this.pino.fatal(...args);
  }

  trace(...args: LogParams) {
    this.pino.trace(...args);
  }
}

export default ElectronLogger;
