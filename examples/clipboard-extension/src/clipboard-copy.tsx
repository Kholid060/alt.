const filePath = 'D:\\test.txt';

export default async function CommandMain() {
  await new Promise((r) => setTimeout(r, 4000));

  await _extension.storage.set('test', 'hello world');
  await _extension.shell.showItemInFolder(filePath);
}