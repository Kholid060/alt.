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
} from '@alt-dot/ui';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import preloadAPI from '/@/utils/preloadAPI';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';
import { isIPCEventError } from '#packages/common/utils/helper';
import UiSelectIcon from '/@/components/ui/UiSelectIcon';
import { useCommandNavigate } from '/@/hooks/useCommandRoute';
import { zodResolver } from '@hookform/resolvers/zod';
import { UiExtIcon } from '@alt-dot/extension';
import { EXTENSION_BUILT_IN_ID } from '#packages/common/utils/constant/extension.const';

const newCommandScriptSchema = z.object({
  icon: z.string(),
  scriptPath: z.string().min(1, { message: 'Script file is required.' }),
  name: z.string().min(3, {
    message: 'Name must be at least 3 characters.',
  }),
});

function CreateCommandScript() {
  const [setPanelHeader, addPanelStatus, clearAll] = useCommandPanelStore(
    useShallow((state) => [state.setHeader, state.addStatus, state.clearAll]),
  );

  const navigate = useCommandNavigate();
  const form = useForm<z.infer<typeof newCommandScriptSchema>>({
    resolver: zodResolver(newCommandScriptSchema),
    defaultValues: {
      icon: '',
      name: '',
      scriptPath: '',
    },
  });

  async function selectScriptFile() {
    try {
      const result = await preloadAPI.main.ipc.invoke('dialog:open', {
        properties: ['openFile'],
        filters: [
          { name: 'JavaScript', extensions: ['js', 'mjs', 'cjs'] },
          { name: 'Python', extensions: ['py', 'pyi'] },
          { name: 'Bash', extensions: ['sh'] },
          { name: 'PowerShell', extensions: ['ps1'] },
        ],
      });
      if (isIPCEventError(result)) {
        addPanelStatus({
          type: 'error',
          title: 'Error!',
          description: result.message,
        });
        return;
      }
      if (result.canceled || !result.filePaths[0]) return;

      form.setValue('scriptPath', result.filePaths[0], {
        shouldValidate: true,
      });
    } catch (error) {
      addPanelStatus({
        type: 'error',
        title: 'Something went wrong',
      });
      console.error(error);
    }
  }
  async function onSubmit({
    icon,
    name,
    scriptPath,
  }: z.infer<typeof newCommandScriptSchema>) {
    try {
      const filePath = new URL(`file://${scriptPath}`).pathname.split('/');
      const filename = filePath.pop()?.replaceAll(/\s/g, '-');
      if (!filename) return;

      const filePathHex = await preloadAPI.main.ipc.invokeWithError(
        'crypto:create-hash',
        'sha256',
        filePath.join('').trim(),
      );

      const result = await preloadAPI.main.ipc.invoke(
        'database:insert-extension-command',
        {
          title: name,
          type: 'script',
          path: scriptPath,
          icon: `icon:${icon}`,
          extensionId: EXTENSION_BUILT_IN_ID.userScript,
          name: `${filePathHex.slice(0, 12)}-${filename}`,
        },
      );
      if (isIPCEventError(result)) {
        addPanelStatus({
          type: 'error',
          title: 'Error!',
          description: result.message,
        });
        return;
      }

      navigate('');
    } catch (error) {
      addPanelStatus({
        type: 'error',
        title: (error as Error).message.includes('UNIQUE constraint')
          ? 'The script file has already been added'
          : 'Something went wrong',
      });
      console.error(error);
    }
  }

  useEffect(() => {
    setPanelHeader({
      icon: 'icon:FileCode2Icon',
      title: 'Create Command Script',
    });

    return () => {
      clearAll();
    };
  }, []);

  return (
    <div className="py-4 px-6">
      <h2 className="font-semibold">Create Command Script</h2>
      <UiForm {...form}>
        <form className="mt-4 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <UiFormField
            control={form.control}
            name="scriptPath"
            render={({ field }) => (
              <UiFormItem className="space-y-0">
                <UiFormLabel className="ml-1">Script file</UiFormLabel>
                <UiFormControl>
                  <UiInput
                    onClick={selectScriptFile}
                    placeholder="D:\script.js"
                    readOnly
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.code !== 'Space')
                        return;
                      event.preventDefault();
                      event.stopPropagation();
                      selectScriptFile();
                    }}
                    {...field}
                  />
                </UiFormControl>
                <UiFormDescription>
                  Supported script files: JavaScript, Python, Bash, and
                  PowerShell
                </UiFormDescription>
                <UiFormMessage />
              </UiFormItem>
            )}
          />
          <div className="flex items-end gap-2">
            <UiSelectIcon
              label="Command script icon"
              side="right"
              tabIndex={0}
              className={form.getFieldState('name').invalid ? 'mb-6' : ''}
              renderIcon={
                <UiFormField
                  name="icon"
                  control={form.control}
                  render={({ field }) => {
                    const Icon =
                      UiExtIcon[field.value as keyof typeof UiExtIcon] ??
                      UiExtIcon.Command;

                    return <Icon className="h-5 w-5" />;
                  }}
                />
              }
              onValueChange={(icon) => form.setValue('icon', icon)}
            />
            <UiFormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <UiFormItem className="space-y-0 flex-1">
                  <UiFormLabel className="ml-1">Name</UiFormLabel>
                  <UiFormControl>
                    <UiInput {...field} placeholder="Command script name" />
                  </UiFormControl>
                  <UiFormMessage />
                </UiFormItem>
              )}
            />
          </div>
          <div className="!mt-8">
            <UiButton className="min-w-28" type="submit">
              Create
            </UiButton>
            <UiButton
              variant="ghost"
              type="reset"
              className="ml-4 min-w-28"
              onClick={() => navigate('')}
            >
              Cancel
            </UiButton>
          </div>
        </form>
      </UiForm>
    </div>
  );
}

export default CreateCommandScript;
