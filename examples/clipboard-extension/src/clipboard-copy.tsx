import { CommandLaunchContext } from '@repo/extension';

const filePath = 'D:\\test.txt';

async function commandExecution() {
  const test = await _extension.runtime.command.launch({
    name: 'javascript.js',
    args: {
      test: 'hello worldo',
    },
  });
  console.log('execution', test);
}
async function commandExecutionFail() {
  try {
    const test = await _extension.runtime.command.launch({
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
function authorizeCredential() {
  return _extension.oauth.authorizationRequest('google-drive').then((token) => {
    if (!token) {
      throw new Error("Credential hasn't been inputted");
    }

    console.log(token);
  });
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

  console.log(await _extension.fs.stat(filePath));
  // await authorizeCredential();
  console.log(await _extension.runtime.config.getValues('command'));
  // await _extension.runtime.config.openConfigPage('command');

  // await _extension.storage.set('test', 'hello world');
  // await _extension.shell.showItemInFolder(filePath);
  // console.log(await _extension.browser.activeTab.get());
  // await _extension.browser.activeTab.type(`textarea[name="q"],[contenteditable="true"],input`, 'Hello world\ntestst', { delay: 10, clearValue: true });
  // console.log(await _extension.browser.activeTab.getText())
  // console.log(await _extension.browser.activeTab.select('select', 'css', 'html'))
  // console.log(await _extension.browser.activeTab.getAttributes('input'));
  // console.log(await _extension.browser.activeTab.getAttributes('input', 'type'));
  // console.log(await _extension.browser.activeTab.getAttributes('input', ['type', 'id']));

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

  // const toast = _extension.ui.createToast({ title: 'Hello world' });
  // toast.show();

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