import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

/**
 * After changing, please reload the extension at `chrome://extensions`
 * @type {chrome.runtime.ManifestV3}
 */
const manifest = {
  manifest_version: 3,
  default_locale: 'en',
  /**
   * if you want to support multiple languages, you can use the following reference
   * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization
   */
  name: '__MSG_extensionName__',
  version: packageJson.version,
  action: {},
  description: '__MSG_extensionDescription__',
  permissions: ['storage', 'tabs', 'scripting'],
  background: {
    service_worker: 'src/pages/background/index.js',
    type: 'module',
  },
  host_permissions: ['http://*/**/*', 'https://*/**/*'],
  icons: {
    128: 'icon-128.png',
  },
  content_scripts:
    process.env.__DEV__ === 'true'
      ? [
          {
            matches: ['*://*/*'],
            run_at: 'document_idle',
            js: ['./src/pages/experiment/index.js'],
          },
        ]
      : undefined,
  web_accessible_resources: [
    {
      resources: [
        'assets/js/*.js',
        'assets/fonts/*.woff2',
        'icon-128.png',
        'icon-34.png',
        '/content-iframe.html',
        'src/pages/content-iframe/index.js',
      ],
      matches: ['*://*/*'],
    },
  ],
};

export default manifest;
