import { cn } from '@/utils/cn';
import { forwardRef } from 'react';

export const UiLogo = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, style, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        'font-semibold leading-none cursor-default select-none',
        className,
      )}
      style={{ fontFeatureSettings: '"ss02"', ...(style ?? {}) }}
      {...props}
    >
      alt<span className="text-primary">.</span>
    </span>
  );
});
UiLogo.displayName = 'UiLogo';
