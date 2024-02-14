import * as React from 'react';
import { type DialogProps } from '@radix-ui/react-dialog';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';

import { cn } from '@/utils/cn';
import { Dialog, DialogContent } from '@/components/dialog';

const UiCommand = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      'ui-flex ui-h-full ui-w-full ui-flex-col ui-overflow-hidden ui-rounded-md ui-bg-popover ui-text-popover-foreground',
      className,
    )}
    {...props}
  />
));
UiCommand.displayName = CommandPrimitive.displayName;

interface CommandDialogProps extends DialogProps {}

const UiCommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="ui-overflow-hidden ui-p-0 ui-shadow-lg">
        <UiCommand className="[&_[cmdk-group-heading]]:ui-px-2 [&_[cmdk-group-heading]]:ui-font-medium [&_[cmdk-group-heading]]:ui-text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:ui-pt-0 [&_[cmdk-group]]:ui-px-2 [&_[cmdk-input-wrapper]_svg]:ui-h-5 [&_[cmdk-input-wrapper]_svg]:ui-w-5 [&_[cmdk-input]]:ui-h-12 [&_[cmdk-item]]:ui-px-2 [&_[cmdk-item]]:ui-py-3 [&_[cmdk-item]_svg]:ui-h-5 [&_[cmdk-item]_svg]:ui-w-5">
          {children}
        </UiCommand>
      </DialogContent>
    </Dialog>
  );
};

const UiCommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="ui-flex ui-items-center ui-border-b ui-px-3" cmdk-input-wrapper="">
    <Search className="ui-mr-2 ui-h-4 ui-w-4 ui-shrink-0 ui-opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'ui-flex ui-h-11 ui-w-full ui-rounded-md ui-bg-transparent ui-py-3 ui-text-sm ui-outline-none placeholder:ui-text-muted-foreground disabled:ui-cursor-not-allowed disabled:ui-opacity-50',
        className,
      )}
      {...props}
    />
  </div>
));

UiCommandInput.displayName = CommandPrimitive.Input.displayName;

const UiCommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn('ui-max-h-[300px] ui-overflow-y-auto ui-overflow-x-hidden', className)}
    {...props}
  />
));

UiCommandList.displayName = CommandPrimitive.List.displayName;

const UiCommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="ui-py-6 ui-text-center ui-text-sm"
    {...props}
  />
));

UiCommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const UiCommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'ui-overflow-hidden ui-p-1 ui-text-foreground [&_[cmdk-group-heading]]:ui-px-2 [&_[cmdk-group-heading]]:ui-py-1.5 [&_[cmdk-group-heading]]:ui-text-xs [&_[cmdk-group-heading]]:ui-font-medium [&_[cmdk-group-heading]]:ui-text-muted-foreground',
      className,
    )}
    {...props}
  />
));

UiCommandGroup.displayName = CommandPrimitive.Group.displayName;

const UiCommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn('ui--mx-1 ui-h-px ui-bg-border', className)}
    {...props}
  />
));
UiCommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const UiCommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'ui-relative ui-flex ui-cursor-default ui-select-none ui-items-center ui-rounded-sm ui-px-2 ui-py-1.5 ui-text-sm ui-outline-none aria-selected:ui-bg-accent aria-selected:ui-text-accent-foreground data-[disabled]:ui-pointer-events-none data-[disabled]:ui-opacity-50',
      className,
    )}
    {...props}
  />
));

UiCommandItem.displayName = CommandPrimitive.Item.displayName;

const UiCommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        'ui-ml-auto ui-text-xs ui-tracking-widest ui-text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
};
UiCommandShortcut.displayName = 'CommandShortcut';

export {
  UiCommand,
  UiCommandList,
  UiCommandItem,
  UiCommandInput,
  UiCommandEmpty,
  UiCommandGroup,
  UiCommandDialog,
  UiCommandShortcut,
  UiCommandSeparator,
};
