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
  credentials: [
    {
      providerId: 'google-drive',
      providerName: 'Google Drive',
      description: 'Auth google drive',
      providerIcon: 'google-drive',
      documentationUrl: 'https://google.com',
      auth: {
        type: 'oauth2',
        grantType: 'code',
        extraParams: { prompt: 'consent', access_type: 'offline' },
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scope: 'profile',
        authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      },
    },
    {
      providerId: 'github',
      providerName: 'GitHub',
      providerIcon: 'github',
      documentationUrl: 'https://github.com',
      auth: {
        type: 'oauth2',
        grantType: 'code',
        scope: 'user',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        authorizeUrl: 'https://github.com/login/oauth/authorize',
        extraParams: { prompt: 'consent', access_type: 'offline' },
      },
    },
  ],
  config: [
    { name: 'number', type: 'input:number', title: 'Input number', placeholder: 'Number placeholder', required: true },
  ],
  commands: [
    {
      name: 'calculcate',
      title: 'Calculate',
      type: 'view:json',
      icon: 'icon:Calculator'
    },
    {
      icon: 'clipboard',
      name: 'clipboard-copy',
      title: 'Clipboard Copy',
      type: 'action',
      context: ['host:https://*.google.com/*', 'all'],
      arguments: [
        {
          name: 'test',
          title: 'Test',
          placeholder: 'Test',
          type: 'input:text'
        },
        {
          name: 'test1',
          title: 'Test',
          type: 'toggle',
          placeholder: 'Test',
        },
        {
          name: 'select',
          required: true,
          title: 'Select!',
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
    },
    {
      icon: 'icon:Terminal',
      name: 'javascript.js',
      title: 'JavaScript',
      type: 'script',
      arguments: [
        {
          name: 'test',
          title: 'テスト',
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
          title: 'Test',
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
          title: 'Test',
          placeholder: 'Placeholder!',
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
    'notifications',
    'browser.activeTab',
  ],
}