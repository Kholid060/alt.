import * as React from 'react';

import { cn } from '@/utils/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  prefixIcon?: JSX.Element;
  suffixIcon?: JSX.Element;
  onValueChange?: (value: string) => void;
}

const UiInput = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      prefixIcon,
      suffixIcon,
      onChange,
      onValueChange,
      ...props
    },
    ref,
  ) => {
    return (
      <>
        {prefixIcon || suffixIcon ? (
          <div className="relative inline-block h-10">
            {prefixIcon && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 transform text-muted-foreground">
                {prefixIcon}
              </span>
            )}
            <input
              type={type}
              className={cn(
                'flex h-full w-full rounded-md border border-input bg-transparent py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                className,
                prefixIcon && 'pl-10 pr-4',
                suffixIcon && 'pl-4 pr-10',
              )}
              ref={ref}
              onChange={(event) => {
                onChange?.(event);
                onValueChange?.(event.target.value);
              }}
              {...props}
            />
            {suffixIcon && (
              <span className="absolute left-auto right-3 top-1/2 -translate-y-1/2 transform text-muted-foreground">
                {suffixIcon}
              </span>
            )}
          </div>
        ) : (
          <input
            type={type}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-transparent px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              className,
            )}
            onChange={(event) => {
              onChange?.(event);
              onValueChange?.(event.target.value);
            }}
            ref={ref}
            {...props}
          />
        )}
      </>
    );
  },
);
UiInput.displayName = 'UiInput';

export { UiInput };
