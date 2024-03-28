import { CommandLaunchContext } from '@repo/extension';

const filePath = 'D:\\test.txt';

export default async function CommandMain(context: CommandLaunchContext) {
  console.log(JSON.stringify(context));
  // await new Promise((r) => setTimeout(r, 4000));

  // await _extension.storage.set('test', 'hello world');
  // await _extension.shell.showItemInFolder(filePath);
  console.log(await _extension.browser.activeTab.get());
  // console.log(await _extension.browser.activeTab.reload());
  await _extension.browser.activeTab.click(`#div_c, input[aria-label="I'm Feeling Lucky"]`);
  await _extension.sqlite.query('SELECT * from test');
}