#!/usr/bin/env node
import { Command } from 'commander';
import ExtensionBuilder from './extension-builder/ExtensionBuilder';

const program = new Command();

program
  .command('build')
  .option('-w, --watch', '[boolean] rebuilds when modules have changed on disk')
  .action(async (name) => {
    const builder = new ExtensionBuilder(Boolean(name.watch));
    await builder.init();
  });

program.parse();
