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

  static contextsToIgnore = [
    'NestFactory',
    'InstanceLoader',
    'RoutesResolver',
    'RouterExplorer',
    'WebSocketsController',
  ];

  private pino: Logger;
  private logPath = path.join(APP_LOGS_DIR, `main-${date}.log`);

  constructor() {
    fs.ensureFileSync(this.logPath);

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
        timestamp: () => {
          const date = new Date();
          const hour = date.getHours().toString().padStart(2, '0');
          const minute = date.getMinutes().toString().padStart(2, '0');
          const second = date.getSeconds().toString().padStart(2, '0');
          const millisecond = date
            .getMilliseconds()
            .toString()
            .padStart(3, '0');

          const dd = String(date.getDate()).padStart(2, '0');
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const yyyy = date.getFullYear();

          return `,"time":"${yyyy}-${mm}-${dd}T${hour}:${minute}:${second}.${millisecond}"`;
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
        dest: this.logPath,
      }),
    );
  }

  async onModuleInit() {
    try {
      const past14DaysLog = dayjs()
        .subtract(14, 'days')
        .format(LOG_DATE_FORMAT);
      await fs.remove(`main-${past14DaysLog}.log`);
    } catch (error) {
      this.error(error);
    }
  }

  log(...args: LogParams) {
    if (ElectronLogger.contextsToIgnore.includes(args[1])) return;

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
