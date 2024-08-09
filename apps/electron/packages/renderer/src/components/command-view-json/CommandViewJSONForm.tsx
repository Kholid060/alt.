import {
  CommandJSONViewForm,
  CommandJSONViewFormFields,
  CommandLaunchBy,
} from '@altdot/extension';
import {
  UiButton,
  UiInput,
  UiLabel,
  UiSelect,
  UiSwitch,
  UiTextarea,
} from '@altdot/ui';
import { useId, useRef } from 'react';
import { useCommandViewJSON } from '/@/context/command-view-json.context';
import preloadAPI from '/@/utils/preloadAPI';

function CommandViewJSONFormFields({
  field,
  onChange,
}: {
  field: CommandJSONViewFormFields;
  onChange(value: unknown): void;
}) {
  const id = useId();

  switch (field.type) {
    case 'date': {
      return (
        <div>
          <UiLabel htmlFor={id} className="ml-1">
            {field.label}
          </UiLabel>
          <UiInput
            id={id}
            className="block w-full"
            onValueChange={onChange}
            required={field.required}
            placeholder={field.placeholder}
            defaultValue={field.defaultValue}
            type={field.includeTime ? 'datetime-local' : 'date'}
          />
          <p className="ml-1 text-xs text-muted-foreground">
            {field.description}
          </p>
        </div>
      );
    }
    case 'select': {
      return (
        <div>
          <UiLabel htmlFor={id} className="ml-1">
            {field.label}
          </UiLabel>
          <UiSelect
            id={id}
            onValueChange={onChange}
            required={field.required}
            placeholder={field.placeholder}
            defaultValue={field.defaultValue}
          >
            {field.options.map((option) =>
              typeof option === 'string' ? (
                <UiSelect.Option key={option} value={option}>
                  {option}
                </UiSelect.Option>
              ) : (
                <UiSelect.Option key={option.value} value={option.label}>
                  {option.label}
                </UiSelect.Option>
              ),
            )}
          </UiSelect>
          <p className="ml-1 text-xs text-muted-foreground">
            {field.description}
          </p>
        </div>
      );
    }
    case 'text': {
      return (
        <div>
          <UiLabel htmlFor={id} className="ml-1">
            {field.label}
          </UiLabel>
          {field.multiline ? (
            <UiTextarea
              id={id}
              className="block w-full"
              required={field.required}
              placeholder={field.placeholder}
              defaultValue={field.defaultValue}
              onChange={(event) => onChange(event.target.value)}
            />
          ) : (
            <UiInput
              id={id}
              className="block w-full"
              type="text"
              onValueChange={onChange}
              required={field.required}
              placeholder={field.placeholder}
              defaultValue={field.defaultValue}
            />
          )}
          <p className="ml-1 text-xs text-muted-foreground">
            {field.description}
          </p>
        </div>
      );
    }
    case 'toggle':
      return (
        <div>
          <div className="flex items-center gap-2">
            <UiSwitch
              id={id}
              onCheckedChange={onChange}
              defaultChecked={field.defaultValue}
            />
            <UiLabel htmlFor={id}>{field.label}</UiLabel>
          </div>
          <p className="ml-1 text-xs text-muted-foreground">
            {field.description}
          </p>
        </div>
      );
    default:
      throw new Error(`"${JSON.stringify(field)}" is invalid form field type`);
  }
}

function getFormFieldsDefaultValue(fields: CommandJSONViewForm['fields']) {
  const value: Record<string, unknown> = {};
  fields.forEach((field) => {
    if (!Array.isArray(field)) {
      value[field.key] = field.defaultValue;
      return;
    }

    field.forEach((item) => {
      value[item.key] = item.defaultValue;
    });
  });

  return value;
}
function CommandViewJSONForm({ data }: { data: CommandJSONViewForm }) {
  const commandViewJSON = useCommandViewJSON();

  const formValue = useRef(getFormFieldsDefaultValue(data.fields));

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    preloadAPI.main.ipc.invoke('extension:execute-command', {
      launchContext: {
        args: {
          [data.name]: JSON.stringify(formValue.current),
        },
        launchBy: CommandLaunchBy.USER,
      },
      commandId: commandViewJSON.payload.detail.commandId,
      extensionId: commandViewJSON.payload.detail.extensionId,
    });
  }

  return (
    <div className="px-6 py-4">
      <h2 className="font-semibold">{data.title}</h2>
      <p className="text-sm text-muted-foreground">{data.description}</p>
      <form className="mt-4 space-y-4" onSubmit={onSubmit}>
        {data.fields.map((field, index) => {
          if (Array.isArray(field)) {
            return (
              <div key={index} className="flex flex-wrap space-x-4">
                {field.map((item) => (
                  <CommandViewJSONFormFields
                    key={item.key}
                    field={item}
                    onChange={(value) => {
                      formValue.current[item.key] = value;
                    }}
                  />
                ))}
              </div>
            );
          }

          return (
            <CommandViewJSONFormFields
              key={field.key}
              field={field}
              onChange={(value) => {
                formValue.current[field.key] = value;
              }}
            />
          );
        })}
        <div className="flex items-center gap-4 pt-2">
          <UiButton type="submit" className="min-w-24">
            {data.submitBtnText ?? 'Submit'}
          </UiButton>
          <UiButton type="button" className="min-w-24" variant="secondary">
            {data.cancenBtnText ?? 'Cancel'}
          </UiButton>
        </div>
      </form>
    </div>
  );
}

export default CommandViewJSONForm;
