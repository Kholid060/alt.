import { cva, VariantProps } from 'class-variance-authority';

const uiTextVariants = cva('', {
  variants: {
    variant: {
      body: '',
      'body-small': 'text-sm',
      'heading-1': 'text-3xl',
      'heading-2': 'text-2xl',
      'heading-3': 'text-xl',
      'heading-4': 'text-lg',
      code: 'font-mono text-sm',
    },
    color: {
      default: '',
      primary: 'text-primary',
      muted: 'text-muted-foreground',
      destructive: 'text-destructive-text',
    },
  },
  defaultVariants: {
    variant: 'body',
    color: 'default',
  },
});

export function UiText({
  color,
  variant,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement | HTMLHeadingElement> &
  VariantProps<typeof uiTextVariants>) {
  let Tag: React.ElementType = 'p';

  switch (variant) {
    case 'body':
    case 'body-small':
      Tag = 'p';
      break;
    case 'code':
      Tag = 'code';
      break;
    case 'heading-1':
      Tag = 'h1';
      break;
    case 'heading-2':
      Tag = 'h2';
      break;
    case 'heading-3':
      Tag = 'h3';
      break;
    case 'heading-4':
      Tag = 'h4';
      break;
  }

  return (
    <Tag className={uiTextVariants({ className, color, variant })} {...props} />
  );
}
