import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
import {
  useForm,
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  FormProviderProps,
  useFormContext,
} from 'react-hook-form';

import { cn } from '@/utils/cn';
import { UiLabel } from '@/components/ui/label';

const UiForm = <
  TFieldValues extends FieldValues,
  TContext = unknown,
  TTransformedValues extends FieldValues | undefined = undefined,
>(
  props: FormProviderProps<TFieldValues, TContext, TTransformedValues>,
) => <FormProvider {...props} />;

type UiFormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<UiFormFieldContextValue>(
  {} as UiFormFieldContextValue,
);

const UiFormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useUiFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(UiFormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type UiFormItemContextValue = {
  id: string;
};

const UiFormItemContext = React.createContext<UiFormItemContextValue>(
  {} as UiFormItemContextValue,
);

const UiFormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { noContainer?: boolean }
>(({ className, children, noContainer, ...props }, ref) => {
  const id = React.useId();

  return (
    <UiFormItemContext.Provider value={{ id }}>
      {noContainer ? (
        children
      ) : (
        <div ref={ref} className={cn('space-y-2', className)} {...props}>
          {children}
        </div>
      )}
    </UiFormItemContext.Provider>
  );
});
UiFormItem.displayName = 'FormItem';

const UiFormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useUiFormField();

  return (
    <UiLabel
      ref={ref}
      className={cn(error && 'text-destructive-text', className)}
      htmlFor={formItemId}
      {...props}
    />
  );
});
UiFormLabel.displayName = 'FormLabel';

const UiFormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useUiFormField();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
});
UiFormControl.displayName = 'FormControl';

const UiFormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useUiFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
UiFormDescription.displayName = 'FormDescription';

const UiFormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useUiFormField();

  let body = children;
  if (error) {
    switch (error.type) {
      case 'required':
        body = 'This field is required';
        break;
      default:
        body = String(error.message);
    }
  }

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn('text-sm font-medium text-destructive-text', className)}
      {...props}
    >
      {body}
    </p>
  );
});
UiFormMessage.displayName = 'FormMessage';

const useUiForm = useForm;

export {
  UiForm,
  useUiForm,
  UiFormItem,
  UiFormLabel,
  UiFormField,
  UiFormControl,
  UiFormMessage,
  useUiFormField,
  UiFormDescription,
};
