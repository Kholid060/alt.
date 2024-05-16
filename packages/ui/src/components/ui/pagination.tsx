import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

import { cn } from '@/utils/cn';
import { ButtonProps, uiButtonVariants } from '@/components/ui/button';

const UiPagination = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn('mx-auto flex w-full justify-center', className)}
    {...props}
  />
);
UiPagination.displayName = 'UiPagination';

const UiPaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<'ul'>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('flex flex-row items-center gap-1', className)}
    {...props}
  />
));
UiPaginationContent.displayName = 'UiPaginationContent';

const UiPaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<'li'>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('', className)} {...props} />
));
UiPaginationItem.displayName = 'UiPaginationItem';

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ButtonProps, 'size'> &
  React.ComponentProps<'a'>;

const UiPaginationLink = ({
  isActive,
  children,
  className,
  size = 'icon',
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      uiButtonVariants({
        variant: isActive ? 'outline' : 'ghost',
        size,
      }),
      className,
    )}
    {...props}
  >
    {children}
  </a>
);
UiPaginationLink.displayName = 'UiPaginationLink';

const UiPaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof UiPaginationLink>) => (
  <UiPaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn('gap-1 pl-2.5', className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </UiPaginationLink>
);
UiPaginationPrevious.displayName = 'UiPaginationPrevious';

const UiPaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof UiPaginationLink>) => (
  <UiPaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn('gap-1 pr-2.5', className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </UiPaginationLink>
);
UiPaginationNext.displayName = 'UiPaginationNext';

const UiPaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => (
  <span
    aria-hidden
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);
UiPaginationEllipsis.displayName = 'UiPaginationEllipsis';

export {
  UiPagination,
  UiPaginationLink,
  UiPaginationNext,
  UiPaginationItem,
  UiPaginationContent,
  UiPaginationEllipsis,
  UiPaginationPrevious,
};
