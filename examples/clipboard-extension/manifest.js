const { author, name, description, version } = require('./package.json');

/** @type {import('@repo/extension').Manifest} */
const manifest = {
  name,
  author,
  version,
  description,
  title: 'Clipboard',
  icon: 'icon:Clipboard',
  commands: [
    {
      icon: 'clipboard',
      name: 'clipboard-copy',
      title: 'Clipboard Copy',
      type: 'action'
    },
	  {
      icon: 'clipboard',
      name: 'clipboard-list',
      title: 'Clipboard List',
      type: 'view'
    },
  ],
  permissions: ['installedApps'],
}

module.exports = manifest;
