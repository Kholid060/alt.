#! node
import { Command } from 'commander';
import buildExtension from './buildExtension';

const program = new Command();

program.command('build').action(buildExtension);

program.parse();
