import { UiCommandItem, UiCommandList } from '../ui/command';

export const ExtCommandList = UiCommandList;

export interface ExtCommandItemProps
  extends Omit<React.DetailsHTMLAttributes<HTMLDivElement>, 'children'> {
  title: string;
  value?: string;
  subtitle?: string;
  onSelect?: () => void;
  icon?: React.ReactNode;
}

export function ExtCommandListItem({
  icon,
  title,
  value,
  onSelect,
  subtitle,
}: ExtCommandItemProps) {
  return (
    <UiCommandItem
      value={value}
      onSelect={onSelect}
      className="group aria-selected:bg-secondary min-h-12"
    >
      {icon && (
        <span className="h-8 w-8 mr-2 inline-flex items-center justify-center">
          {icon}
        </span>
      )}
      <div>
        <p className="leading-tight">{title}</p>
        <p className="text-muted-foreground leading-tight">{subtitle}</p>
      </div>
    </UiCommandItem>
  );
}
