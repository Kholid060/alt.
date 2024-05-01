import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/utils/cn';
import { cva } from 'class-variance-authority';

type UiTabVariant = 'default' | 'line';

const TabVariantCtx = React.createContext<UiTabVariant>('default');

const UiTabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> & {
    variant?: UiTabVariant;
  }
>(({ variant = 'default', children, ...props }, ref) => {
  return (
    <TabVariantCtx.Provider value={variant}>
      <TabsPrimitive.Root ref={ref} {...props}>
        {children}
      </TabsPrimitive.Root>
    </TabVariantCtx.Provider>
  );
});
UiTabs.displayName = TabsPrimitive.Root.displayName;

export const uiTabListVariants = cva('inline-flex h-10 items-center', {
  variants: {
    variant: {
      default: 'justify-center rounded-md bg-muted p-1 text-muted-foreground',
      line: 'w-full justify-start border-b',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});
const UiTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => {
  const variant = React.useContext(TabVariantCtx);

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(uiTabListVariants({ className, variant }))}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  );
});
UiTabsList.displayName = TabsPrimitive.List.displayName;

export const uiTabTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'rounded-sm px-3 py-1.5 ring-offset-background transition-all focus-visible:ring-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        line: 'relative border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none data-[state=active]:border-b-primary data-[state=active]:text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);
const UiTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const variant = React.useContext(TabVariantCtx);
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(uiTabTriggerVariants({ variant, className }))}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
});
UiTabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const UiTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className,
    )}
    {...props}
  />
));
UiTabsContent.displayName = TabsPrimitive.Content.displayName;

export { UiTabs, UiTabsList, UiTabsTrigger, UiTabsContent };
