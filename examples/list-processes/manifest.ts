import type { ExtensionManifest } from '@altdot/extension';
import { name, version } from './package.json';

const config: ExtensionManifest = {
  name,
  version,
  author: 'kholid060',
  icon: 'list-process',
  title: 'List Processes',
  categories: ['Applications', 'Productivity'],
  description: 'Pick a color from anywhere on your screen',
  commands: [
    {
      type: 'view',
      name: 'list-process',
      title: 'Running Processes',
      description: 'Pick color from screen',
    },
    {
      type: 'script',
      isInternal: true,
      name: 'get-process.js',
      title: 'Get all running processes',
    },
    {
      type: 'script',
      isInternal: true,
      name: 'kill-process.js',
      title: 'Kill running processes',
    },
  ],
  permissions: ['shell', 'clipboard', 'command'],
};

export default config;
