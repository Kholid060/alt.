import { cn } from '@/index';
import { forwardRef } from 'react';

export const UiKbd = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => {
    return (
      <kbd
        ref={ref}
        className={cn(
          'text-center ml-0.5 font-sans text-xs tracking-widest text-muted-foreground border border-border/50 border-b-2 px-1.5 py-0.5 rounded-[6px]',
          className,
        )}
        {...props}
      />
    );
  },
);
UiKbd.displayName = 'UiKbd';
