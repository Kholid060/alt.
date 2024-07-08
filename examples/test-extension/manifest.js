import packageJSON from './package.json' with { type: 'json' };

const { author, name, description, version } = packageJSON;

/** @type {import('@altdot/extension').Manifest} */
export default {
  name,
  author,
  version,
  description,
  title: 'Clipboard',
  icon: 'icon:Cake',
  config: [
    { name: 'Hello-world', type: 'input:text', required: true, title: 'Hello world' },
  ],
  commands: [
    {
      name: 'index',
      type: 'action',
      title: 'Hello worldo',
      config: [
        {
          name: 'test',
          title: 'Testo',
          required: true,
          defaultValue: 100,
          type: 'input:number',
          placeholder: 'Input a number',
        }
      ]
    }
  ]
}