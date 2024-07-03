import { zodResolver } from '@hookform/resolvers/zod';
import {
  UiForm,
  UiFormField,
  UiFormItem,
  UiFormLabel,
  UiFormControl,
  UiInput,
  UiFormMessage,
  UiTextarea,
  UiIcons,
} from '@alt-dot/ui';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import UiSelectIcon from '../ui/UiSelectIcon';

const newWorkflowSchema = z.object({
  description: z
    .string()
    .max(128, { message: 'Description must be less than 128 characters.' })
    .optional(),
  icon: z.string().default('Command'),
  name: z
    .string()
    .min(3, { message: 'Name must be at least 3 characters.' })
    .max(64, { message: 'Name must be less than 64 characters.' }),
});
export type NewWorkflowSchema = z.infer<typeof newWorkflowSchema>;

function WorkflowDetailForm({
  children,
  onSubmit,
  defaultValue = {},
}: {
  children?: React.ReactNode;
  defaultValue?: Partial<NewWorkflowSchema>;
  onSubmit?: (value: NewWorkflowSchema) => void;
}) {
  const form = useForm<NewWorkflowSchema>({
    resolver: zodResolver(newWorkflowSchema),
    defaultValues: {
      name: '',
      description: '',
      icon: 'Command',
      ...defaultValue,
    },
  });

  return (
    <UiForm {...form}>
      <form onSubmit={form.handleSubmit((value) => onSubmit?.(value))}>
        <div className="flex items-start gap-4 mt-7">
          <UiSelectIcon
            label="Workflow icon"
            renderIcon={
              <UiFormField
                name="icon"
                control={form.control}
                render={({ field }) => {
                  const Icon =
                    UiIcons[field.value as keyof typeof UiIcons] ??
                    UiIcons.Command;
                  return <Icon className="h-5 w-5" />;
                }}
              />
            }
            onValueChange={(icon) => form.setValue('icon', icon)}
          />
          <UiFormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <UiFormItem className="flex-grow space-y-0 relative">
                <UiFormLabel className="ml-2 absolute -top-5">Name</UiFormLabel>
                <UiFormControl>
                  <UiInput {...field} placeholder="Workflow name" />
                </UiFormControl>
                <UiFormMessage />
              </UiFormItem>
            )}
          ></UiFormField>
        </div>
        <UiFormField
          name="description"
          control={form.control}
          render={({ field }) => (
            <UiFormItem className="space-y-1 mt-4">
              <UiFormLabel className="ml-2">Description</UiFormLabel>
              <UiTextarea {...field} placeholder="Workflow description" />
              <UiFormMessage />
            </UiFormItem>
          )}
        />
        {children}
      </form>
    </UiForm>
  );
}

export default WorkflowDetailForm;
