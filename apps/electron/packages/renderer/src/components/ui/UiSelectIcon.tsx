import {
  UiPopover,
  UiTooltip,
  UiPopoverTrigger,
  UiButton,
  UiPopoverContent,
  UiIcons,
} from '@alt-dot/ui';
import clsx from 'clsx';

interface UiSelectIconProps extends React.HTMLAttributes<HTMLButtonElement> {
  label: string;
  value?: string;
  renderIcon?: React.ReactNode;
  side?: 'bottom' | 'top' | 'right' | 'left';
  onValueChange?: (value: string) => void;
}

function UiSelectIcon({
  side,
  value,
  label,
  renderIcon,
  onValueChange,
  ...props
}: UiSelectIconProps) {
  const Icon = UiIcons[value as keyof typeof UiIcons] ?? UiIcons.Command;

  return (
    <UiPopover modal>
      <UiTooltip label={label}>
        <UiPopoverTrigger asChild>
          <UiButton tabIndex={-1} variant="secondary" size="icon" {...props}>
            {renderIcon || <Icon className="h-5 w-5" />}
          </UiButton>
        </UiPopoverTrigger>
      </UiTooltip>
      <UiPopoverContent className="h-80 w-72 overflow-auto" side={side}>
        <p>Icons</p>
        <div className="mt-2 grid grid-cols-5 gap-1 text-muted-foreground">
          {Object.entries(UiIcons).map(([name, Icon]) => (
            <button
              key={name}
              title={name}
              className={clsx(
                'inline-flex h-10 w-full items-center justify-center rounded-lg hover:bg-secondary hover:text-foreground',
                value === name && 'text-primary',
              )}
              onClick={() => onValueChange?.(name)}
            >
              <Icon className="h-5 w-5" />
            </button>
          ))}
        </div>
      </UiPopoverContent>
    </UiPopover>
  );
}

export default UiSelectIcon;
