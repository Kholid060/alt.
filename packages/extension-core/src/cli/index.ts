import { Command } from 'commander';
import buildExtension from './buildExtension';

const program = new Command();

program
  .command('build')
  .option('-w, --watch', '[boolean] rebuilds when modules have changed on disk')
  .action((name) => {
    buildExtension(Boolean(name.watch));
  });

program.parse();
