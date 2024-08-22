---
title: Form View
---

Build a form to collect information from the users.

When the user submit the form, the values can be access in the environment variable with the `__ARGS__FORM_VALUE` key or the one that you defined in the form `name` property.
The form value is stored as JSON with `{ "key": "value" }` format where the property key is the key you defined in the form field.

```ts
interface CommandJSONViewForm {
  type: 'form';
  name?: string;
  title?: string;
  description?: string;
  cancelBtnText?: string;
  submitBtnText?: string;
  fields: (CommandJSONViewFormFields | CommandJSONViewFormFields[])[];
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `type` | `form` | The view type |
| `fields` | <code>([CommandJSONViewFormFields](#form-fields) \| [CommandJSONViewFormFields](#form-fields)[])[]</code> | The form's fields  |
| `name` | `?string` | The key where the form value can be accessed in the environment variable, default is `form_value`. This will be converted as `SCREAMING_SNAKE_CASE` with `__ARGS__` as the prefix. For example, `form_value` converted into `__ARGS__FORM_VALUE` |
| `title` | `?string` | The form's title |
| `description` | `?string` | Description of the form |
| `cancelBtnText` | `?string` | Text on the form cancel button  |
| `submitBtnText` | `?string` | Text on the form submit button  |


**Example**

```js
console.log(JSON.stringify({
  view: {
    type: 'form',
    title: 'Forms',
    fields: [
      {
        key: 'text-field-1',
        type: 'text',
        label: 'Text field',
      },
      {
        key: 'textarea',
        type: 'text',
        multiline: true,
        label: 'Textarea',
      },
      // This will be in the same row
      [
        {
          type: 'toggle',
          key: 'toggle1',
          label: 'Toggle 1',
        },
        {
          type: 'toggle',
          key: 'toggle2',
          label: 'Toggle 2',
        },
      ]
    ]
  }
}));
``` 

## Form Fields

List field you can use to create a form.

```ts
type CommandJSONViewFormFields =
  | CommandJSONViewFormDate
  | CommandJSONViewFormToggle
  | CommandJSONViewFormSelect
  | CommandJSONViewFormTextField;
```

### Text Field

Displays a form input field.

```ts
interface CommandJSONViewFormTextField {
  key: string;
  type: 'text';
  label?: string;
  required?: boolean;
  multiline?: boolean;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `type` | `text` | The form field type |
| `key` | `string` | The field unique key |
| `label` | `?string` | Label for the field |
| `required` | `?boolean` | Whether the user is required to input the field |
| `multiline` | `?boolean` | Whether the user can input multiple line of text |
| `description` | `?string` | Description of the form field |
| `placeholder` | `?string` | Text to be displayed when the field has no value |
| `defaultValue` | `?string` | Default value of the field |

**Example**

```js
console.log(JSON.stringify({
  view: {
    type: 'form',
    fields: [
      {
        key: 'text-field',
        type: 'text',
        label: 'Text field',
      },
      {
        key: 'textarea',
        type: 'text',
        multiline: true,
        label: 'Textarea',
      },
    ]
  }
}));
``` 

### Date Field

Displays a date form input field.

```ts
interface CommandJSONViewFormTextField {
  key: string;
  type: 'date';
  label?: string;
  required?: boolean;
  multiline?: boolean;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `type` | `date` | The form field type |
| `key` | `string` | The field unique key |
| `label` | `?string` | Label for the field |
| `required` | `?boolean` | Whether the user is required to input the field |
| `includeTime` | `?boolean` | Whether to show the time selection |
| `description` | `?string` | Description of the form field |
| `placeholder` | `?string` | Text to be displayed when the field has no value |
| `defaultValue` | `?string` | Default value of the field |

**Example**

```js
console.log(JSON.stringify({
  view: {
    type: 'form',
    fields: [
      {
        key: 'date',
        type: 'date',
        label: 'Select a date',
      },
    ]
  }
}));
``` 

### Select Field

Displays a list of options for the user to pick from.

```ts
interface CommandJSONViewFormTextField {
  key: string;
  type: 'select';
  options: (string | { label: string; value: string })[];
  label?: string;
  required?: boolean;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `type` | `select` | The form field type |
| `key` | `string` | The field unique key |
| `options` | `(string \| { label: string; value: string })[]` | The select's options |
| `label` | `?string` | Label for the field |
| `required` | `?boolean` | Whether the user is required to input the field |
| `description` | `?string` | Description of the form field |
| `placeholder` | `?string` | Text to be displayed when the field has no value |
| `defaultValue` | `?string` | Default value of the field |

**Example**

```js
console.log(JSON.stringify({
  view: {
    type: 'form',
    fields: [
      {
        key: 'select',
        type: 'select',
        label: 'Select an option',
        options: [
          'option-1',
          { label: 'Option 2', value: 'option-2' },
          { label: 'Option 3', value: 'option-3' },
        ]
      },
    ]
  }
}));
``` 

### Toggle Field

A control that allows the user to toggle between checked and not checked.

```ts
interface CommandJSONViewFormTextField {
  key: string;
  type: 'toggle';
  label?: string;
  description?: string;
  defaultValue?: boolean;
}
```

| Property | Type | Description |
| ----------- | ----------- | ----------- |
| `type` | `toggle` | The form field type |
| `key` | `string` | The field unique key |
| `label` | `?string` | Label for the field |
| `description` | `?string` | Description of the form field |
| `defaultValue` | `?boolean` | Default value of the field |

**Example**

```js
console.log(JSON.stringify({
  view: {
    type: 'form',
    fields: [
      {
        key: 'toggle',
        type: 'toggle',
        label: 'Airplane Mode',
      },
    ]
  }
}));
``` 