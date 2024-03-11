import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';

import { cn } from '@/utils/cn';
import { VariantProps, cva } from 'class-variance-authority';

const uiSwitchRootVariants = cva(
  'peer inline-fle shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
  {
    variants: {
      size: {
        default: 'h-6 w-11',
        sm: 'h-5 w-9',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

const uiSwitchThumbVariants = cva(
  'pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=unchecked]:translate-x-0',
  {
    variants: {
      size: {
        default: 'h-5 w-5 data-[state=checked]:translate-x-5',
        sm: 'h-4 w-4 data-[state=checked]:translate-x-[17px]',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

const UiSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> &
    VariantProps<typeof uiSwitchRootVariants>
>(({ className, size, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(cn(uiSwitchRootVariants({ size, className })))}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb className={uiSwitchThumbVariants({ size })} />
  </SwitchPrimitives.Root>
));
UiSwitch.displayName = SwitchPrimitives.Root.displayName;

export { UiSwitch };
