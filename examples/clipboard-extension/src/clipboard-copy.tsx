import { _extension, CommandLaunchContext, OAuthRedirect } from '@altdot/extension';
import fs from 'fs';

const filePath = 'D:\\test.txt';

async function commandExecution() {
  const test = await _extension.command.launch({
    name: 'javascript.js',
    args: {
      test: 'hello worldo',
    },
  });
  console.log('execution', test);
}
async function commandExecutionFail() {
  try {
    const test = await _extension.command.launch({
      name: 'a-command',
      args: {
        test: 'hello world',
      },
    });
    console.log('execution-', test);
  } catch (error) {
    console.error(error);
  }
}
async function authorizeCredential() {
  const clientId = '479459643785-qqth353989l18jm7rdrl7d6vqii8r73d.apps.googleusercontent.com';
  const oauthClient = _extension.oAuth.createPKCE({
    key: 'google-drive',
    client: {
      clientId,
      scope: 'profile',
      redirectMethod: OAuthRedirect.AppUrl,
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    },
    name: 'Google Drive',
    icon: 'google-drive',
    description: 'Auth google drive',
  });

  const token = await oauthClient.getToken();
  console.log(oauthClient, token);
  if (token) {
    console.log(token);
    return;
  }

  const request = await oauthClient.startAuth();
  if (!request) throw new Error('Missing request');

  console.log(request);

  const searchParams = new URLSearchParams();
  searchParams.set('code', request.code);
  searchParams.set('client_id', clientId);
  searchParams.set('grant_type', 'authorization_code');
  searchParams.set('redirect_uri', request.redirectUri);
  searchParams.set('code_verifier', request.codeVerifier);

  const response = await fetch(`https://oauth2.googleapis.com/token`, {
    method: 'POST',
    body: searchParams,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  const body = await response.json();
  console.log(JSON.stringify(body));

  await oauthClient.setToken(body);
}

async function selectFile() {
  const activeTab = await _extension.browser.tabs.getActive();
  if (!activeTab) throw new Error('No active tab');
  await activeTab?.selectFile('input[type="file"]', [
    {
      contents: new Uint8Array([1]),
      fileName: '',
      lastModified: Date.now(), mimeType: 'text/plain'
    },
    filePath
  ]);
}

async function selectElement() {
  const activeTab = await _extension.browser.tabs.getActive();
  if (!activeTab) throw new Error('No active tab');

  const element = await activeTab?.selectElement({ filter: {  } })
  console.log(element);
}
function alertConfirm() {
  return _extension.ui.alert.confirm({
    body: 'World',
    title: 'Hello',
    okText: 'Confirm!!',
    okVariant: 'destructive',
    cancelText: 'Cancel!!!!',
  });
}
async function getTabs() {
  const tabs = await _extension.browser.tabs.query({});
  console.log(JSON.stringify(tabs.map((tab) => ({ id: tab.id, title: tab.title, url: tab.title }))));
}
async function storage() {
  await _extension.storage.secure.set('halo', 'secure!!');

  const test = await _extension.storage.local.get('halo');
  const secureTest = await _extension.storage.secure.get('halo');
  console.log('secure', JSON.stringify(secureTest));
  if (!test.halo) {
    console.log('empty');
    await _extension.storage.local.set('halo', { object: 'test' });
    return;
  }

  console.log(JSON.stringify({ test }));
}

export default async function CommandMain(context: CommandLaunchContext) {
  console.log(JSON.stringify(context));
  // await new Promise((r) => setTimeout(r, 4000));

  // await _extension.mainWindow.close();

  // await commandExecutionFail();
  // await commandExecution();

  // await _extension.runtime.command.updateDetail({
  //   subtitle: 'Hello worldo!!!',
  // });

  // const element = await _extension.browser.activeTab.selectElement({ description: 'Select an element!!!' });
  // console.log(element);
  // await _extension.browser.activeTab.type('textarea[aria-label="Search"]', 'hello!');

  // console.log(await alertConfirm());

  // await authorizeCredential();

  // await getTabs();
  // await selectElement();
  // await selectFile();

  // console.log('__', JSON.stringify(_extension.runtime.platform, null, 2));

  // const result = await _extension.childProcess.exec(`node -e "console.log(process.env)"`, [])
  // console.log(result.stdout);

  // await storage();

  // await authorizeCredential();
  // await _extension.runtime.config.openConfigPage('command');

  // await _extension.storage.set('test', 'hello world');
  // await _extension.shell.showItemInFolder(filePath);

  console.log(process.env);
  // const [googleTab] = await _extension.browser.tabs.query({ url: '*://*.google.com/' });
  // if (!googleTab) throw new Error('missing google tab');
  // await googleTab.type(`textarea[name="q"]`, 'Hello world\ntestst', { delay: 10, clearValue: true });
  // console.log(await googleTab.getText())
  // console.log(await googleTab.select('select', 'css', 'html'))
  // console.log(await googleTab.getAttributes('input'));
  // console.log(await googleTab.getAttributes('input', 'type'));
  // console.log(await googleTab.getAttributes('input', ['type', 'id']));

  // const inputEl = await _extension.browser.activeTab.findAllElements('input[type="text"]');
  // await inputEl[0].type('hello world')
  // console.log(await inputEl[0].getAttributes());

  // const isAvailable = await _extension.browser.activeTab.get();
  // console.log(_extension, { isAvailable });
  // if (!isAvailable) throw new Error('TABB!!!');


  // console.log(
  //   await _extension.browser.activeTab.getHTML('body'),
  //   await _extension.browser.activeTab.getHTML('body', { outerHTML: true }),
  // );

  // await new Promise((r) => setTimeout(r, 1000));

  // await _extension.notifications.create({
  //   body: 'huh',
  //   subtitle: 'subtitle?',
  //   title: 'Hello worldo',
  // });

  // toast.hide();

  // await new Promise((r) => setTimeout(r, 5000));

  // const paragraphsEl = await _extension.browser.activeTab.findAllElements('p');
  // console.log(await paragraphsEl[0]?.getText(), '\n\n\n', await paragraphsEl[1]?.getText());
}