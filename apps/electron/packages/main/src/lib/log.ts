import log from 'electron-log/main';

type LoggerLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug';

export function logger(level: LoggerLevel, location: string[], ...args: unknown[]) {
  log[level](`{${location.join(' > ')}}`, ...args);
}

export function loggerBuilder(location: string[]) {
  return (level: LoggerLevel, ...args: unknown[]) => {
    logger(level, location, ...args);
  }
}

export function ErrorLogger(...location: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function(...args: unknown[]) {
      try {
        return await originalMethod.apply(this, ...args);
      } catch (error) {
        if (error instanceof Error) {
          logger('error', location.length == 0 ? [propertyKey] : location, error.message);
        }

        throw error;
      }
    }

    return descriptor;
  };
}

export default log;
