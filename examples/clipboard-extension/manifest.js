import packageJSON from './package.json' with { type: "json" };

const { author, name, description, version } = packageJSON;

/** @type {import('@repo/extension').Manifest} */
export default {
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