import packageJSON from './package.json' with { type: 'json' };

const { author, name, description, version } = packageJSON;

/** @type {import('@repo/extension').Manifest} */
export default {
  name,
  author,
  version,
  description,
  title: 'Clipboard',
  icon: 'icon:Clipboard',
  extensionType: 'default',
  commands: [
    {
      icon: 'clipboard',
      name: 'clipboard-copy',
      title: 'Clipboard Copy',
      type: 'action',
      arguments: [
        {
          name: 'test',
          placeholder: 'Test',
          type: 'input:text'
        },
        {
          name: 'select',
          placeholder: 'Select',
          type: 'select',
          options: [
            {
              label: 'Option 1',
              value: '1'
            },
            {
              label: 'Option 2',
              value: '2'
            }
          ]
        }
      ]
    },
    {
      icon: 'clipboard',
      name: 'clipboard-list',
      title: 'Clipboard List',
      type: 'view'
    },
    {
      icon: 'icon:Terminal',
      name: 'bash-script.sh',
      title: 'Bash script',
      type: 'script',
      arguments: [
        {
          name: 'test',
          placeholder: 'Test',
          type: 'input:text'
        }
      ],
    },
    {
      icon: 'icon:Terminal',
      name: 'javascript.js',
      title: 'JavaScript',
      type: 'script',
      arguments: [
        {
          name: 'test',
          placeholder: 'Test',
          type: 'input:text'
        }
      ],
    },
    {
      icon: 'icon:Terminal',
      name: 'python.py',
      title: 'Python',
      type: 'script',
      arguments: [
        {
          name: 'test',
          placeholder: 'Test',
          type: 'input:text'
        }
      ],
    },
    {
      icon: 'icon:Terminal',
      name: 'powershell-script.ps1',
      title: 'Powershell',
      type: 'script',
      arguments: [
        {
          name: 'test',
          placeholder: 'Test',
          type: 'input:text',
          required: true,
        }
      ],
    },
  ],
  permissions: [
    'fs',
    'shell',
    'sqlite',
    'storage',
    'clipboard',
  ],
}