import chalk from 'chalk';

export const logger = {
  info: (message: string) => {
    console.log(`${chalk.blue('info')} ${message}`);
  },
  error: (message: string) => {
    console.error(`${chalk.red('error')} ${message}`);
  },
};

export class BuildError extends Error {
  constructor(message: string) {
    super(message);
  }
}
