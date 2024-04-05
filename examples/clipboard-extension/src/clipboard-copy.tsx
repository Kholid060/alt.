import { CommandLaunchContext } from '@repo/extension';

const filePath = 'D:\\test.txt';

export default async function CommandMain(context: CommandLaunchContext) {
  console.log(JSON.stringify(context));
  // await new Promise((r) => setTimeout(r, 4000));

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

  const toast = _extension.ui.createToast({ title: 'Hello world' });
  toast.show();

  await new Promise((r) => setTimeout(r, 1000));

  toast.hide();

  await new Promise((r) => setTimeout(r, 5000));

  const paragraphsEl = await _extension.browser.activeTab.findAllElements('p');
  console.log(await paragraphsEl[0]?.getText(), '\n\n\n', await paragraphsEl[1]?.getText());
}