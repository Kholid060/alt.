import { CommandLaunchContext } from '@repo/extension';

const filePath = 'D:\\test.txt';

export default async function CommandMain(context: CommandLaunchContext) {
  console.log(JSON.stringify(context));
  // await new Promise((r) => setTimeout(r, 4000));

  // await _extension.storage.set('test', 'hello world');
  // await _extension.shell.showItemInFolder(filePath);
  console.log(await _extension.browser.activeTab.get());
  // await _extension.browser.activeTab.type(`textarea[name="q"],[contenteditable="true"]`, 'Hello world\ntestst', { delay: 10, clearValue: true });
  console.log(await _extension.browser.activeTab.getText())
  console.log(await _extension.browser.activeTab.getText('p'))
}