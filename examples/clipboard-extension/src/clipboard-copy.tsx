const filePath = 'D:\\test.txt';

export default async function CommandMain() {
  await _extension.shell.showItemInFolder(filePath);
}