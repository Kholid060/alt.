import { useEffect, useState } from 'react';
import { UseFormReturn, useForm } from 'react-hook-form';
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
} from '@altdot/ui';
import preloadAPI from '/@/utils/preloadAPI';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { IPCEventError } from '#common/interface/ipc-events.interface';
import { useCommandCtx } from '/@/hooks/useCommandCtx';
import {
  ExtensionCommandExecutePayload,
  ExtensionConfigType,
} from '#packages/common/interface/extension.interface';
import { getExtIconURL, isIPCEventError } from '/@/utils/helper';
import { useDatabase } from '/@/hooks/useDatabase';
import {
  ExtensionConfigValue,
  ExtensionConfigWithSchemaModel,
} from '#packages/main/src/extension/extension-config/extension-config.interface';
import { ExtensionConfig } from '@altdot/extension/dist/extension-manifest';

type ConfigComponent<T extends ExtensionConfigType = ExtensionConfigType> =
  React.FC<{
    form: UseFormReturn;
    config: Extract<ExtensionConfig, { type: T }>;
  }>;

const ConfigInputDirectory: ConfigComponent = ({ config, form }) => {
  const addPanelStatus = useCommandPanelStore.use.addStatus();

  async function selectDirectory() {
    try {
      const result = await preloadAPI.main.ipc.invoke('dialog:open', {
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
      const result = await preloadAPI.main.ipc.invoke('dialog:open', {
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
                if (event.key !== 'Enter' && event.code !== 'Space') return;

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

const ConfigInputPassword: ConfigComponent = ({ config }) => {
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
              type="password"
              {...field}
            />
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
  'input:password': ConfigInputPassword,
  select: ConfigSelect as ConfigComponent,
  'input:directory': ConfigInputDirectory,
  'input:file': ConfigInputFile as ConfigComponent,
};

function ConfigInput({
  data,
  configId,
  executeCommandPayload,
}: {
  configId: string;
  data: ExtensionConfigWithSchemaModel;
  executeCommandPayload?: ExtensionCommandExecutePayload;
}) {
  const addPanelStatus = useCommandPanelStore.use.addStatus();
  const setPanelHeader = useCommandPanelStore.use.setHeader();

  const navigate = useCommandNavigate();
  const { executeCommand } = useCommandCtx();

  const form = useForm<Record<string, unknown>>({
    async defaultValues() {
      if (!Array.isArray(data.config)) return {};

      const defaultValues: Record<string, unknown> = {};
      data.config.forEach((item) => {
        if (data.value && Object.hasOwn(data.value, item.name)) {
          defaultValues[item.name] = data.value[item.name];
        } else if (Object.hasOwn(item, 'defaultValue')) {
          defaultValues[item.name] = item.defaultValue ?? '';
        }
      });

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

      const dataTypeMap = new Map(
        data.config.map((config) => [config.name, config.type]),
      );
      const valuesWithType = Object.keys(values).reduce<ExtensionConfigValue>(
        (acc, key) => {
          const type = dataTypeMap.get(key);
          if (type) {
            acc[key] = {
              type,
              value: values[key],
            };
          }

          return acc;
        },
        {},
      );

      if (data.value) {
        result = await preloadAPI.main.ipc.invoke(
          'database:update-extension-config',
          configId,
          {
            value: valuesWithType,
          },
        );
      } else {
        result = await preloadAPI.main.ipc.invoke(
          'database:insert-extension-config',
          {
            configId,
            extensionId,
            value: valuesWithType,
          },
        );
      }

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
    setPanelHeader({
      title: data.commandTitle || data.extensionTitle,
      subtitle: data.commandTitle ? data.extensionTitle : '',
      icon: getExtIconURL(
        data.commandIcon || data.extensionIcon,
        data.extensionId,
      ),
    });

    return () => {
      setPanelHeader(null);
    };
  }, [data, setPanelHeader]);

  if (!Array.isArray(data.config)) return null;

  return (
    <div className="px-6 py-4">
      <h2 className="font-semibold">Configuration</h2>
      {executeCommandPayload && (
        <p className="text-sm text-muted-foreground">
          You must input the config before running the command
        </p>
      )}
      <UiForm {...form}>
        <form
          className="mt-4 flex flex-col gap-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {data.config.map((item) => {
            const ConfigComponent = configComponentMap[item.type];

            return (
              <ConfigComponent key={item.name} config={item} form={form} />
            );
          })}
          <div className="mt-2 flex items-center gap-4">
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

function ConfigInputRoute() {
  const navigate = useCommandNavigate();
  const { queryDatabase } = useDatabase();
  const currentRoute = useCommandRoute((state) => state.currentRoute!);

  const executeCommandPayload = currentRoute.data?.executeCommandPayload as
    | ExtensionCommandExecutePayload
    | undefined;

  const [config, setConfig] = useState<{
    id: string;
    data: ExtensionConfigWithSchemaModel;
  } | null>(null);

  useEffect(() => {
    const { configId } = currentRoute.params as { configId: string };
    if (!configId) {
      navigate('');
      return;
    }

    const [extensionId, commandId] = configId.split(':');

    return queryDatabase({
      name: 'database:get-extension-config',
      args: [{ configId, extensionId, commandId }],
      onData(data) {
        if (!data) {
          navigate('');
          return;
        }

        console.trace();

        setConfig({
          data,
          id: configId,
        });
      },
    });
  }, [currentRoute.params, navigate, queryDatabase]);

  if (!config) return null;

  return (
    <ConfigInput
      data={config.data}
      configId={config.id}
      executeCommandPayload={executeCommandPayload}
    />
  );
}

export default ConfigInputRoute;
