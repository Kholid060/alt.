import { forwardRef } from 'react';
import { UiCommandItem, UiCommandList } from '@repo/ui';
import { LucideIcon } from 'lucide-react';

export const ExtCommandList = UiCommandList;

export interface ExtCommandItemProps
  extends Omit<
    React.DetailsHTMLAttributes<HTMLDivElement>,
    'children' | 'prefix'
  > {
  title: string;
  value?: string;
  subtitle?: string;
  onSelect?: () => void;
  prefix?: React.ReactNode;
}

export const ExtCommandListItem = forwardRef<
  HTMLDivElement,
  ExtCommandItemProps & { children?: React.ReactNode }
>(({ prefix, title, value, onSelect, subtitle, children }, ref) => {
  return (
    <UiCommandItem
      ref={ref}
      value={value}
      onSelect={onSelect}
      className="group aria-selected:bg-secondary min-h-12"
    >
      {children ? (
        children
      ) : (
        <>
          {prefix && (
            <span className="h-8 w-8 mr-2 inline-flex items-center justify-center">
              {prefix}
            </span>
          )}
          <div>
            <p className="leading-tight">{title}</p>
            <p className="text-muted-foreground leading-tight">{subtitle}</p>
          </div>
        </>
      )}
    </UiCommandItem>
  );
});
ExtCommandListItem.displayName = 'ExtCommandListItem';

export const ExtCommandListIcon = forwardRef<
  HTMLSpanElement,
  { icon: LucideIcon | string }
>(({ icon: Icon }, ref) => {
  return (
    <span
      ref={ref}
      className="group-aria-selected:bg-secondary-hover  group-aria-selected:text-foreground text-muted-foreground inline-flex justify-center items-center bg-secondary rounded-sm border border-border/40 h-full w-full"
    >
      {typeof Icon === 'string' ? Icon : <Icon className="h-4 w-4" />}
    </span>
  );
});
ExtCommandListIcon.displayName = 'ExtCommandListIcon';
