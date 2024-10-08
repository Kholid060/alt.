import { EXTENSION_CATEGORIES, WebAppWorkflow } from '@altdot/shared';
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
} from '@altdot/ui';
import clsx from 'clsx';
import { UseFormReturn, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { EyeIcon, PlusIcon, XIcon } from 'lucide-react';
import UiMarkdown from '../ui/UiMarkdown';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import dayjs from '@/lib/dayjs';

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
    prependSlot?: React.ReactNode;
    onSubmit?: (values: WorkflowFormValues) => void;
  }
>(({ workflow, className, prependSlot, children, onSubmit }, ref) => {
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
          'grid max-w-3xl grid-cols-1 items-start gap-x-4 gap-y-2 md:grid-cols-12 md:gap-y-8',
          className,
        )}
      >
        {prependSlot}
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
                      className="inline-flex items-center rounded-full border px-3 py-1.5 text-sm"
                      onClick={() =>
                        form.setValue(
                          'categories',
                          field.value.filter((category) => category !== item),
                          { shouldDirty: true },
                        )
                      }
                    >
                      {item}
                      <XIcon className="-mr-1 ml-1 inline size-4 text-muted-foreground" />
                    </button>
                  ))}
                  <UiFormControl>
                    <UiDropdownMenu>
                      <UiDropdownMenuTrigger asChild>
                        <UiButton
                          variant="secondary"
                          type="button"
                          size="sm"
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
                      <UiDropdownMenuContent align="start">
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
                      <EyeIcon className="mr-2 size-5" />
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
  updatedAt,
  className,
  suffixSlot,
  description,
  ...props
}: {
  icon: string;
  title: string;
  updatedAt?: string;
  description: string;
  suffixSlot?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const Icon =
    UiIcons[icon.split(':')[1] as keyof typeof UiIcons] ?? UiIcons.Command;

  return (
    <div className={clsx('items-center md:flex', className)} {...props}>
      <div className="inline-block rounded-md border border-border/40 bg-card p-2 text-muted-foreground">
        <Icon className="size-10" />
      </div>
      <div className="flex-grow md:ml-4">
        <h2 className="cursor-default text-2xl font-semibold leading-tight">
          {title}
        </h2>
        <p className="line-clamp-1 text-sm text-muted-foreground">
          {updatedAt && `Last updated ${dayjs(updatedAt).fromNow()} •`}{' '}
          {description}
        </p>
      </div>
      {suffixSlot}
    </div>
  );
}
