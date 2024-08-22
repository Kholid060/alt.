---
title: Form
---

For building a form for collecting information from the user.

This form component is a wrapper around the [`react-hook-form`](https://react-hook-form.com/) library. We'll also use [`zod`](https://zod.dev/) to validate the form.


**Anatomy**

```tsx
const uiForm = useUiForm();

<UiForm {...uiForm}>
  <UiFormField
    control={...}
    name="..."
    render={() => (
      <UiFormItem>
        <UiFormLabel />
        <UiFormControl>
          { /* Your form field */}
        </UiFormControl>
        <UiFormDescription />
        <UiFormMessage />
      </UiFormItem>
    )}
  />
</UiForm>

```

## Components

### UiForm

Contains all the parts of a form. 

This component is a wrapper of the `react-hook-form` library [`FormProvider`](https://react-hook-form.com/docs/formprovider) component.

**Example**

```tsx
// view-command.tsx
import { useUiForm, UiForm } from '@altdot/extension';

export default function Command() {
  const uiForm = useUiForm({
    defaultValues: {
      username: '',
    }
  });

  return (
    <UiForm {...uiForm}>
      <form>
        {/* ... */}
      </form>
    </UiForm>
  )
}
```

**Props**

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| `...props` | `object` | Require all the [`useUiForm`](#useuiform) methods |

### UiFormField

The wrapper for a form field.

This component is a wrapper of the `react-hook-form` library [`Controller`](https://react-hook-form.com/docs/usecontroller/controller) component.

**Example**

```tsx {18-22} {5}
// view-command.tsx
import {
  UiForm,
  useUiForm,
  UiFormField,
} from '@altdot/extension';

export default function Command() {
  const uiForm = useUiForm({
    defaultValues: {
      username: '',
    }
  });

  return (
    <UiForm {...uiForm}>
      <form>
        <UiFormField
          name="username"
          control={uiForm.control}
          render={/* ... */}
        />
      </form>
    </UiForm>
  )
}
```

**Props**

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| `name` | `string` | Name of the field |
| `control` | [`Control`](https://react-hook-form.com/ts#Control) | `control` object is from invoking [useUiForm](#useuiform) |
| `render` | `Function` | A function that returns a React element and provides the ability to attach events and value into the component |

### UiFormItem

The wrapper for a form field. It handles id of the field.

**Example**

```tsx {6} {23-25}
// view-command.tsx
import {
  UiForm,
  useUiForm,
  UiFormField,
  UiFormItem,
} from '@altdot/extension';

export default function Command() {
  const uiForm = useUiForm({
    defaultValues: {
      username: '',
    }
  });

  return (
    <UiForm {...uiForm}>
      <form>
        <UiFormField
          name="username"
          control={uiForm.control}
          render={() => (
            <UiFormItem>
              {/* ... */}
            </UiFormItem>
          )}
        />
      </form>
    </UiForm>
  )
}
```
**Props**

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| `noContainer` | `?boolean` | Whether to wrap the field inside a [`<div>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div) element |

### UiFormLabel

A label element for the field which is automatically wired when nested inside a `UiFormItem` component.

**Example**

```tsx {7} {25}
// view-command.tsx
import {
  UiForm,
  useUiForm,
  UiFormField,
  UiFormItem,
  UiLabel,
} from '@altdot/extension';

export default function Command() {
  const uiForm = useUiForm({
    defaultValues: {
      username: '',
    }
  });

  return (
    <UiForm {...uiForm}>
      <form>
        <UiFormField
          name="username"
          control={uiForm.control}
          render={() => (
            <UiFormItem>
              <UiLabel>Username</UiLabel>
              {/* ... */}
            </UiFormItem>
          )}
        />
      </form>
    </UiForm>
  )
}
```

### UiFormControl

A control element which is automatically wired when nested inside a `UiFormField` component.

**Example**

```tsx {8} {28-30}
// view-command.tsx
import {
  UiForm,
  useUiForm,
  UiFormField,
  UiFormItem,
  UiLabel,
  UiFormControl,
  UiInput
} from '@altdot/extension';

export default function Command() {
  const uiForm = useUiForm({
    defaultValues: {
      username: '',
    }
  });

  return (
    <UiForm {...uiForm}>
      <form>
        <UiFormField
          name="username"
          control={uiForm.control}
          render={({ field }) => (
            <UiFormItem>
              <UiLabel>Username</UiLabel>
              <UiFormControl>
                <UiInput {...field} />
              </UiFormControl>
              {/* ... */}
            </UiFormItem>
          )}
        />
      </form>
    </UiForm>
  )
}
```

### UiFormDescription

A description about the field.

**Example**

```tsx {10} {32-34}
// view-command.tsx
import {
  UiForm,
  useUiForm,
  UiFormField,
  UiFormItem,
  UiLabel,
  UiFormControl,
  UiInput,
  UiFormDescription
} from '@altdot/extension';

export default function Command() {
  const uiForm = useUiForm({
    defaultValues: {
      username: '',
    }
  });

  return (
    <UiForm {...uiForm}>
      <form>
        <UiFormField
          name="username"
          control={uiForm.control}
          render={({ field }) => (
            <UiFormItem>
              <UiLabel>Username</UiLabel>
              <UiFormControl>
                <UiInput {...field} />
              </UiFormControl>
              <UiFormDescription>
                Create a username
              </UiFormDescription>
              {/* ... */}
            </UiFormItem>
          )}
        />
      </form>
    </UiForm>
  )
}
```

### UiFormMessage

Display the validation message when the value doesn't match the schema of the given field.

**Example**

```tsx {11} {36}
// view-command.tsx
import {
  UiForm,
  useUiForm,
  UiFormField,
  UiFormItem,
  UiLabel,
  UiFormControl,
  UiInput,
  UiFormDescription,
  UiFormMessage
} from '@altdot/extension';

export default function Command() {
  const uiForm = useUiForm({
    defaultValues: {
      username: '',
    }
  });

  return (
    <UiForm {...uiForm}>
      <form>
        <UiFormField
          name="username"
          control={uiForm.control}
          render={({ field }) => (
            <UiFormItem>
              <UiLabel>Username</UiLabel>
              <UiFormControl>
                <UiInput {...field} />
              </UiFormControl>
              <UiFormDescription>
                Create a username
              </UiFormDescription>
              <UiFormMessage />
            </UiFormItem>
          )}
        />
      </form>
    </UiForm>
  )
}
```

## Hooks

### useUiForm

Wrapper around the [`useForm`](https://react-hook-form.com/docs/useform) hook of the `react-hook-form` library.

## Example

```tsx
// view-command.tsx
import {
  UiForm,
  UiInput,
  UiButton,
  useUiForm,
  UiFormItem,
  UiFormField,
  UiFormLabel,
  UiFormControl,
  UiFormMessage,
  UiFormDescription,
} from '@altdot/extension';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  username: z.string().min(2, {
    message: 'Username must be at least 2 characters.',
  }),
});
type FormValue = z.infer<typeof formSchema>;

export default function Command() {
  const uiForm = useUiForm<FormValue>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: ''
    }
  });

  function onSubmit(values: FormValue) {
    console.log(values);
  }

  return (
    <UiForm {...uiForm}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <UiFormField
          name="username"
          control={uiForm.control}
          render={({ field }) => (
            <UiFormItem>
              <UiFormLabel>Username</UiFormLabel>
              <UiFormControl>
                <UiInput placeholder="john_doe" {...field} />
              </UiFormControl>
              <UiFormDescription>
                Create a username
              </UiFormDescription>
              <UiFormMessage />
            </UiFormItem>
          )}
        />
        <UiButton type="submit">Submit</UiButton>
      </form>
    </UiForm>
  )
}
```