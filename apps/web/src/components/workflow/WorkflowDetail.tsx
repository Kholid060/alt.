import { EXTENSION_CATEGORIES, WebAppWorkflow } from '@alt-dot/shared';
import {
  UiInput,
  UiTextarea,
  UiForm,
  UiFormField,
  UiFormItem,
  UiFormLabel,
  UiFormControl,
  UiFormMessage,
  UiButton,
  UiDropdownMenu,
  UiDropdownMenuTrigger,
  UiDropdownMenuContent,
  UiDropdownMenuItem,
  UiIcons,
  UiDialog,
} from '@alt-dot/ui';
import clsx from 'clsx';
import { UseFormReturn, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { EyeIcon, PlusIcon, XIcon } from 'lucide-react';
import UiMarkdown from '../ui/UiMarkdown';
import { forwardRef, useImperativeHandle, useRef } from 'react';

const workflowFormSchema = z.object({
  name: z
    .string()
    .min(3, {
      message: 'Name must be at least 3 characters.',
    })
    .max(64, {
      message: 'Name must be less than 64 characters.',
    }),
  description: z
    .string()
    .max(128, {
      message: 'Name must be less than 128 characters.',
    })
    .optional()
    .default(''),
  readme: z.string().max(5000, {
    message: 'Content must be less than 5000 characters',
  }),
  categories: z.enum(EXTENSION_CATEGORIES).array().min(1, {
    message: 'Workflow must have atleast 1 category',
  }),
});
type WorkflowFormValues = z.infer<typeof workflowFormSchema>;
export interface WorkflowDetailRef {
  containerEl: HTMLFormElement | null;
  form: UseFormReturn<WorkflowFormValues>;
}

export const WorkflowDetail = forwardRef<
  WorkflowDetailRef,
  {
    className?: string;
    workflow: WebAppWorkflow;
    children?: React.ReactNode;
    onSubmit?: (values: WorkflowFormValues) => void;
  }
>(({ workflow, className, children, onSubmit }, ref) => {
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<WorkflowFormValues>({
    resolver: zodResolver(workflowFormSchema),
    defaultValues: {
      name: workflow.name,
      readme: workflow.readme ?? '',
      categories: workflow.categories ?? [],
      description: workflow.description ?? '',
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      form,
      containerEl: formRef.current,
    }),
    [form],
  );

  return (
    <UiForm {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit((values) => onSubmit?.(values))}
        className={clsx(
          'grid grid-cols-1 md:grid-cols-12 items-start max-w-3xl gap-x-4 md:gap-y-8 gap-y-2',
          className,
        )}
      >
        <UiFormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <UiFormItem noContainer>
              <UiFormLabel className="col-span-5 mt-4 md:mt-0">
                Name
              </UiFormLabel>
              <UiFormControl className="col-span-7">
                <UiInput {...field} placeholder="name" />
              </UiFormControl>
              <UiFormMessage />
            </UiFormItem>
          )}
        />
        <UiFormField
          name="description"
          control={form.control}
          render={({ field }) => (
            <UiFormItem noContainer>
              <UiFormLabel className="col-span-5 mt-4 md:mt-0">
                Short description
              </UiFormLabel>
              <UiFormControl className="col-span-7">
                <UiTextarea {...field} placeholder="Short description" />
              </UiFormControl>
              <UiFormMessage />
            </UiFormItem>
          )}
        />
        <UiFormField
          name="categories"
          control={form.control}
          render={({ field }) => (
            <UiFormItem noContainer>
              <UiFormLabel className="col-span-5 mt-4 md:mt-0">
                Categories
              </UiFormLabel>
              <div className="col-span-7">
                <div className="flex flex-wrap items-center gap-2">
                  {field.value.map((item) => (
                    <button
                      key={item}
                      className="py-1.5 px-3 rounded-full border text-sm inline-flex items-center"
                      onClick={() =>
                        form.setValue(
                          'categories',
                          field.value.filter((category) => category !== item),
                        )
                      }
                    >
                      {item}
                      <XIcon className="size-4 inline ml-1 text-muted-foreground -mr-1" />
                    </button>
                  ))}
                  <UiFormControl>
                    <UiDropdownMenu>
                      <UiDropdownMenuTrigger asChild>
                        <UiButton
                          variant="secondary"
                          type="button"
                          onBlur={field.onBlur}
                          ref={field.ref}
                          disabled={
                            field.value.length === EXTENSION_CATEGORIES.length
                          }
                        >
                          <PlusIcon className="size-4" />
                          Add
                        </UiButton>
                      </UiDropdownMenuTrigger>
                      <UiDropdownMenuContent>
                        {EXTENSION_CATEGORIES.filter(
                          (item) => !field.value.includes(item),
                        ).map((item) => (
                          <UiDropdownMenuItem
                            key={item}
                            onClick={() =>
                              form.setValue('categories', [
                                ...field.value,
                                item,
                              ])
                            }
                          >
                            {item}
                          </UiDropdownMenuItem>
                        ))}
                      </UiDropdownMenuContent>
                    </UiDropdownMenu>
                  </UiFormControl>
                </div>
                <UiFormMessage />
              </div>
            </UiFormItem>
          )}
        />
        <UiFormField
          name="readme"
          control={form.control}
          render={({ field }) => (
            <UiFormItem noContainer>
              <div className="col-span-5 mt-4 md:mt-0">
                <UiFormLabel>Description</UiFormLabel>
                <p className="text-xs text-muted-foreground">
                  Markdown supported
                </p>
              </div>
              <div className="relative col-span-7">
                <UiFormControl>
                  <UiTextarea {...field} placeholder="# description" />
                </UiFormControl>
                <UiDialog>
                  <UiDialog.Trigger asChild>
                    <UiButton
                      className="mt-2"
                      type="button"
                      size="sm"
                      variant="secondary"
                    >
                      <EyeIcon className="size-5 mr-2" />
                      Preview
                    </UiButton>
                  </UiDialog.Trigger>
                  <UiDialog.Content className="max-w-xl">
                    <UiMarkdown markdown={field.value} />
                  </UiDialog.Content>
                </UiDialog>
                <UiFormMessage />
              </div>
            </UiFormItem>
          )}
        />
        {children}
      </form>
    </UiForm>
  );
});
WorkflowDetail.displayName = 'WorkflowDetail';

export function WorkflowDetailHeader({
  icon,
  title,
  iconUrl,
  svgClass,
  className,
  suffixSlot,
  description,
  ...props
}: {
  icon: string;
  title: string;
  iconUrl: string;
  svgClass?: string;
  description: string;
  suffixSlot?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const Icon =
    UiIcons[icon.split(':')[1] as keyof typeof UiIcons] ?? UiIcons.Command;

  return (
    <div className={clsx('md:flex items-center', className)} {...props}>
      <div className="p-2 rounded-md border bg-card border-border/40 text-muted-foreground inline-block">
        <Icon className={svgClass} />
      </div>
      <div className="md:ml-4 flex-grow">
        <h2 className="text-2xl font-semibold cursor-default leading-tight">
          {title}
        </h2>
      </div>
      {suffixSlot}
    </div>
  );
}
