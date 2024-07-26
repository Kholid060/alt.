import { ExtensionManifest } from '@altdot/extension';

const manifest: ExtensionManifest = {
  name: 'send-emails-bulk',
  title: 'Send Emails Bulk',
  description: 'Send emails in bulk through the browser',
  author: 'kholid060',
  categories: ['Automation'],
  icon: 'bulk-email',
  version: '0.0.1',
  commands: [
    {
      type: 'action',
      title: 'Send Emails',
      name: 'send-email-bulk',
      config: [
        {
          required: false,
          name: 'googleApiKey',
          type: 'input:password',
          title: 'Google API Key',
          placeholder: 'AIzaSyBYE31eCxxxxxxxxxxxxxxxxxxxxxxxxxx',
          description: 'API key for accessing the Google Sheet values',
        },
      ],
      arguments: [
        {
          required: true,
          name: 'filePath',
          type: 'input:text',
          title: 'File path',
          placeholder: 'D:/file.csv',
          description: 'Excel or CSV file path',
        },
        {
          name: 'range',
          type: 'input:text',
          title: 'Sheet range',
          placeholder: 'Sheet1!A1:D5',
        },
      ],
    },
  ],
  permissions: ['fs.read', 'browser.tabs'],
};

export default manifest;
