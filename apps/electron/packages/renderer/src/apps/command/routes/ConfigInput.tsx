import { useEffect, useRef } from 'react';
import { UseFormReturn, useForm } from 'react-hook-form';
import { ExtensionConfig } from '@repo/extension-core';
import { useCommandNavigate, useCommandRoute } from '/@/hooks/useCommandRoute';
import {
  UiButton,
  UiForm,
  UiFormControl,
  UiFormDescription,
  UiFormField,
  UiFormItem,
  UiFormLabel,
  UiFormMessage,
  UiInput,
  UiSelect,
  UiSwitch,
} from '@repo/ui';
import preloadAPI from '/@/utils/preloadAPI';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { IPCEventError } from '#common/interface/ipc-events.interface';
import { useCommandCtx } from '/@/hooks/useCommandCtx';
import { ExtensionCommandExecutePayload } from '#packages/common/interface/extension.interface';
import { isIPCEventError } from '/@/utils/helper';

type ConfigComponent<
  T extends ExtensionConfig['type'] = ExtensionConfig['type'],
> = React.FC<{
  form: UseFormReturn;
  config: Extract<ExtensionConfig, { type: T }>;
}>;

const ConfigInputDirectory: ConfigComponent = ({ config, form }) => {
  const addPanelStatus = useCommandPanelStore.use.addStatus();

  async function selectDirectory() {
    try {
      const result = await preloadAPI.main.invokeIpcMessage('dialog:open', {
        properties: ['openDirectory'],
      });
      if ('$isError' in result) {
        addPanelStatus({
          type: 'error',
          title: result.message,
        });
        return;
      }
      if (result.canceled) return;

      form.setValue(config.name, result.filePaths[0]);
    } catch (error) {
      console.error(error);
      addPanelStatus({
        type: 'error',
        title: 'Something went wrong',
      });
    }
  }

  return (
    <UiFormField
      name={config.name}
      control={form.control}
      defaultValue=""
      rules={{ required: config.required }}
      render={({ field }) => (
        <UiFormItem className="space-y-1">
          <UiFormLabel>{config.title}</UiFormLabel>
          <UiFormControl>
            <UiInput
              placeholder={config.placeholder}
              {...field}
              readOnly
              onClick={selectDirectory}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;

                event.preventDefault();
                event.stopPropagation();
                selectDirectory();
              }}
            />
          </UiFormControl>
          <UiFormDescription>{config.description}</UiFormDescription>
          <UiFormMessage />
        </UiFormItem>
      )}
    />
  );
};

const ConfigInputFile: ConfigComponent<'input:file'> = ({ config, form }) => {
  const addPanelStatus = useCommandPanelStore.use.addStatus();

  async function selectFile() {
    try {
      const result = await preloadAPI.main.invokeIpcMessage('dialog:open', {
        properties: ['openFile'],
        filters: config.fileFilter,
      });
      if ('$isError' in result) {
        addPanelStatus({
          type: 'error',
          title: result.message,
        });
        return;
      }
      if (result.canceled) return;

      form.setValue(config.name, result.filePaths[0]);
    } catch (error) {
      console.error(error);
      addPanelStatus({
        type: 'error',
        title: 'Something went wrong',
      });
    }
  }

  return (
    <UiFormField
      name={config.name}
      defaultValue=""
      rules={{ required: config.required }}
      render={({ field }) => (
        <UiFormItem className="space-y-1">
          <UiFormLabel>{config.title}</UiFormLabel>
          <UiFormControl>
            <UiInput
              placeholder={config.placeholder}
              {...field}
              onClick={selectFile}
              readOnly
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;

                event.preventDefault();
                event.stopPropagation();
                selectFile();
              }}
            />
          </UiFormControl>
          <UiFormDescription>{config.description}</UiFormDescription>
          <UiFormMessage />
        </UiFormItem>
      )}
    />
  );
};

const ConfigInputNumber: ConfigComponent = ({ config }) => {
  return (
    <UiFormField
      name={config.name}
      defaultValue=""
      rules={{ required: config.required }}
      render={({ field }) => (
        <UiFormItem className="space-y-1">
          <UiFormLabel>{config.title}</UiFormLabel>
          <UiFormControl>
            <UiInput
              placeholder={config.placeholder}
              {...field}
              type="number"
              onChange={(event) => {
                field.onChange(event.target.valueAsNumber);
              }}
            />
          </UiFormControl>
          <UiFormDescription>{config.description}</UiFormDescription>
          <UiFormMessage />
        </UiFormItem>
      )}
    />
  );
};

const ConfigInputText: ConfigComponent = ({ config }) => {
  return (
    <UiFormField
      name={config.name}
      defaultValue=""
      rules={{ required: config.required }}
      render={({ field }) => (
        <UiFormItem className="space-y-1">
          <UiFormLabel>{config.title}</UiFormLabel>
          <UiFormControl>
            <UiInput placeholder={config.placeholder} {...field} />
          </UiFormControl>
          <UiFormDescription>{config.description}</UiFormDescription>
          <UiFormMessage />
        </UiFormItem>
      )}
    />
  );
};

const ConfigSelect: ConfigComponent<'select'> = ({ config }) => {
  return (
    <UiFormField
      name={config.name}
      rules={{ required: config.required }}
      render={({ field }) => (
        <UiFormItem className="space-y-1">
          <UiFormLabel>{config.title}</UiFormLabel>
          <UiFormControl>
            <UiSelect
              ref={field.ref}
              value={field.value}
              disabled={field.disabled}
              onValueChange={field.onChange}
              placeholder={config.placeholder}
            >
              {config.options.map((option) => (
                <UiSelect.Option key={option.value} value={option.value}>
                  {option.label}
                </UiSelect.Option>
              ))}
            </UiSelect>
          </UiFormControl>
          <UiFormDescription>{config.description}</UiFormDescription>
          <UiFormMessage />
        </UiFormItem>
      )}
    />
  );
};

const ConfigToggle: ConfigComponent = ({ config }) => {
  return (
    <UiFormField
      name={config.name}
      rules={{ required: config.required }}
      render={({ field }) => (
        <UiFormItem className="flex items-center space-y-0">
          <UiFormControl>
            <UiSwitch
              ref={field.ref}
              checked={field.value}
              onBlur={field.onBlur}
              disabled={field.disabled}
              onCheckedChange={field.onChange}
            />
          </UiFormControl>
          <div className="ml-3">
            <UiFormLabel>{config.title}</UiFormLabel>
            <UiFormDescription>{config.description}</UiFormDescription>
          </div>
          <UiFormMessage />
        </UiFormItem>
      )}
    />
  );
};

const configComponentMap: Record<ExtensionConfig['type'], ConfigComponent> = {
  toggle: ConfigToggle,
  'input:text': ConfigInputText,
  'input:number': ConfigInputNumber,
  select: ConfigSelect as ConfigComponent,
  'input:directory': ConfigInputDirectory,
  'input:file': ConfigInputFile as ConfigComponent,
};

function ConfigInput() {
  const addPanelStatus = useCommandPanelStore.use.addStatus();
  const currentRoute = useCommandRoute((state) => state.currentRoute!);

  const navigate = useCommandNavigate();
  const { executeCommand } = useCommandCtx();

  const alreadyHasValue = useRef(false);

  const { configId } = currentRoute.params;
  const { config, executeCommand: executeCommandPayload } =
    currentRoute.data as {
      config: ExtensionConfig[];
      executeCommand?: ExtensionCommandExecutePayload;
    };

  const form = useForm<Record<string, unknown>>({
    async defaultValues() {
      if (!configId || !Array.isArray(config)) return {};

      let defaultValues: Record<string, unknown> = {};
      config.forEach((item) => {
        if (!Object.hasOwn(item, 'defaultValue')) return;

        defaultValues[item.name] = item.defaultValue ?? '';
      });

      const configValues = await preloadAPI.main.invokeIpcMessage(
        'extension-config:get',
        configId,
      );
      if (configValues && !('$isError' in configValues)) {
        defaultValues = { ...defaultValues, ...configValues.value };
        alreadyHasValue.current = true;
      }

      return defaultValues;
    },
  });

  async function onSubmit(values: Record<string, unknown>) {
    try {
      if (!configId) return;

      let extensionId = configId;
      if (configId.includes(':')) {
        extensionId = configId.slice(0, configId.indexOf(':'));
      }

      let result: IPCEventError | void;

      if (alreadyHasValue.current) {
        result = await preloadAPI.main.invokeIpcMessage(
          'extension-config:update',
          configId,
          {
            value: values,
          },
        );
      } else {
        result = await preloadAPI.main.invokeIpcMessage(
          'extension-config:set',
          configId,
          {
            extensionId,
            value: values,
          },
        );
      }
      console.log({ result });
      if (isIPCEventError(result)) {
        addPanelStatus({
          type: 'error',
          title: result.message,
        });
        return;
      }

      if (executeCommandPayload) {
        executeCommand(executeCommandPayload);
      }

      navigate('', { panelHeader: null });
    } catch (error) {
      console.error(error);
      addPanelStatus({
        type: 'error',
        title: 'Something went wrong',
      });
    }
  }

  useEffect(() => {
    if (!config || config.length === 0) {
      navigate('', { panelHeader: null });
    }
  }, [config, navigate]);

  if (!Array.isArray(config)) return null;

  return (
    <div className="py-4 px-6">
      <h2 className="font-semibold">Configuration</h2>
      {executeCommandPayload && (
        <p className="text-muted-foreground text-sm">
          You must input the config before running the command
        </p>
      )}
      <UiForm {...form}>
        <form
          className="flex flex-col mt-4 gap-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {config.map((item) => {
            const ConfigComponent = configComponentMap[item.type];

            return (
              <ConfigComponent key={item.name} config={item} form={form} />
            );
          })}
          <div className="flex items-center mt-2 gap-4">
            <UiButton className="mt-4 min-w-24" type="submit">
              Save
            </UiButton>
            <UiButton
              variant="ghost"
              className="mt-4 min-w-24"
              type="reset"
              onClick={() => navigate('', { panelHeader: null })}
            >
              Cancel
            </UiButton>
          </div>
        </form>
      </UiForm>
    </div>
  );
}

export default ConfigInput;
