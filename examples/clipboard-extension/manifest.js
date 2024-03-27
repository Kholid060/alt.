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
  config: [
    { name: 'number', type: 'input:number', title: 'Input number', placeholder: 'Number placeholder', required: true },
  ],
  commands: [
    {
      icon: 'clipboard',
      name: 'clipboard-copy',
      title: 'Clipboard Copy',
      type: 'action',
      context: ['host:https://*.google.com/*'],
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
      type: 'view',
      config: [
        { name: 'number', type: 'input:number', title: 'Input number', placeholder: 'Number placeholder', defaultValue: 10 },
        { name: 'config-file', type: 'input:file', title: 'Select config file', placeholder: 'File placeholder', required: true, fileFilter: [{ extensions: ['json', 'yaml'], name: 'Config file' }] },
        { name: 'all-file', type: 'input:file', title: 'Select any file', placeholder: 'File placeholder', required: true },
        { name: 'text', type: 'input:text', title: 'Text', placeholder: 'Text placeholder', defaultValue: 'Hello world' },
        { name: 'dir', type: 'input:directory', title: 'Input DIR', placeholder: 'Directory placeholder', description: 'Select a direcotry' },
        { name: 'select', type: 'select', title: 'Select', placeholder: 'Directory placeholder', options: [{ label: 'Option 1', value: 'option-1' }, { label: 'Option 2', value: 'option-2' }] },
        { name: 'toggle', type: 'toggle', title: 'Toggle' }
      ],
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
    'browser.activeTab',
  ],
}