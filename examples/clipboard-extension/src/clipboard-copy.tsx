const filePath = 'D:\\test.txt';

export default async function CommandMain() {
  console.log('before', JSON.stringify(await _extension.storage.getAll()));
  await _extension.storage.clear();
  console.log('after', JSON.stringify(await _extension.storage.getAll()));
  console.log('hello');
}