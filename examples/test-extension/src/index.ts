export default async function MainCommand() {
  console.log(JSON.stringify(await _extension.runtime.config.getValues()));
  console.log(JSON.stringify(await _extension.runtime.config.getValues('extension')));
  console.log('hello world');
}
