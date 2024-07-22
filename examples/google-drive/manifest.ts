import type { ExtensionManifest } from '@altdot/extension';
import { name, version } from './package.json';

const config: ExtensionManifest = {
  name,
  version,
  author: 'kholid060',
  icon: 'google-drive',
  title: 'Google Drive',
  categories: ['Applications'],
  description: 'List Google Drive files',
  commands: [
    {
      type: 'view',
      name: 'files-list',
      title: 'List Files',
    },
  ],
  permissions: ['shell', 'clipboard'],
};

export default config;
