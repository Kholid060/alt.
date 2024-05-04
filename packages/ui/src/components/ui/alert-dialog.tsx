import * as React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';

import { cn } from '@/utils/cn';
import { uiButtonVariants } from '@/components/ui/button';
import { VariantProps } from 'class-variance-authority';

const UiAlertDialog = AlertDialogPrimitive.Root;

const UiAlertDialogTrigger = AlertDialogPrimitive.Trigger;

const UiAlertDialogPortal = AlertDialogPrimitive.Portal;

const UiAlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
    ref={ref}
  />
));
UiAlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const UiAlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <UiAlertDialogPortal>
    <UiAlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
        className,
      )}
      {...props}
    />
  </UiAlertDialogPortal>
));
UiAlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const UiAlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-2 text-center sm:text-left',
      className,
    )}
    {...props}
  />
);
UiAlertDialogHeader.displayName = 'UiAlertDialogHeader';

const UiAlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className,
    )}
    {...props}
  />
);
UiAlertDialogFooter.displayName = 'UiAlertDialogFooter';

const UiAlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold', className)}
    {...props}
  />
));
UiAlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const UiAlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
UiAlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName;

const UiAlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> &
    VariantProps<typeof uiButtonVariants>
>(({ className, variant, size, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(uiButtonVariants({ variant, size }), className)}
    {...props}
  />
));
UiAlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

const UiAlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      uiButtonVariants({ variant: 'outline' }),
      'mt-2 sm:mt-0',
      className,
    )}
    {...props}
  />
));
UiAlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
  UiAlertDialog,
  UiAlertDialogTitle,
  UiAlertDialogPortal,
  UiAlertDialogHeader,
  UiAlertDialogFooter,
  UiAlertDialogAction,
  UiAlertDialogCancel,
  UiAlertDialogOverlay,
  UiAlertDialogTrigger,
  UiAlertDialogContent,
  UiAlertDialogDescription,
};
