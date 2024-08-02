import { ExtensionManifest } from '@altdot/extension';

const manifest: ExtensionManifest = {
  name: 'to-do',
  title: 'To-Do',
  description: 'Create To-Do list',
  author: 'username',
  categories: ['Other'],
  icon: 'todo',
  version: '1.0.0',
  commands: [
    {
      type: 'view',
      name: 'todo-list',
      title: 'To-Do List',
    },
  ],
  permissions: ['storage'],
};

export default manifest;
