import { CommandLaunchContext } from '@repo/extension';

const filePath = 'D:\\test.txt';

export default async function CommandMain(context: CommandLaunchContext) {
  console.log(JSON.stringify(context));
  // await new Promise((r) => setTimeout(r, 4000));

  // await _extension.storage.set('test', 'hello world');
  // await _extension.shell.showItemInFolder(filePath);
  await _extension.sqlite.query('SELECT * from test');
}