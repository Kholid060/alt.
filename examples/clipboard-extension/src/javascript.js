/**
 * @type {import('@altdot/extension').CommandJSON}
 */
let jsonData = {};
if (process.env.__ARGS__FORM_VALUE) {
  const formValue = JSON.parse(process.env.__ARGS__FORM_VALUE);
  jsonData = {
    view: {
      type: 'text',
      text: `Hello world\n ${formValue.date}`,
    }
  }
} else {
  jsonData = {
    view: {
      type: 'form',
      title: 'Hello',
      description: 'hahaha',
      fields: [
        { type: 'date', key: 'date', description: 'Date!!!', label: 'Date' },
        { type: 'date', key: 'date2', description: 'Date2!!!', label: 'Date', includeTime: true },
        { type: 'text', label: 'Text', key: 'text' },
        { type: 'text', label: 'Textarea', key: 'textarea', multiline: true, placeholder: 'textarea' },
        [
          { type: 'toggle', key: 'toggle', label: 'toggle', description: 'toggle' },
          { type: 'toggle', key: 'toggle2', label: 'toggle2' },
        ],
        {
          type: 'select',
          key: 'select',
          label: 'Select',
          defaultValue: 'select1',
          options: [
            { label: 'Hello', value: 'select1' },
            'Option 2',
          ],
        }
      ]
    }
  }
}

console.log(JSON.stringify(jsonData));