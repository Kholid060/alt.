import {
  UiCommandGroup,
  UiCommandList,
  UiCommandSeparator,
  UiCommandEmpty,
  UiCommandItem,
} from '@repo/ui';
import type { LucideIcon } from 'lucide-react';

function CommandItem({
  icon,
  title,
  value,
  onSelect,
  subtitle,
}: {
  title: string;
  value?: string;
  subtitle?: string;
  onSelect?: () => void;
  icon?: React.ReactNode;
}) {
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

function ExtensionList({ children }: { children: React.ReactNode }) {
  return <UiCommandList className="p-2">{children}</UiCommandList>;
}

function ExtensionListItemIcon({
  icon: Icon,
  ...props
}: { icon: LucideIcon } & React.ComponentPropsWithoutRef<LucideIcon>) {
  return (
    <span className="group-aria-selected:bg-secondary-hover inline-flex justify-center items-center bg-secondary rounded-sm border border-border/40 h-full w-full">
      <Icon
        {...props}
        className="h-4 w-4 group-aria-selected:text-foreground text-muted-foreground"
      />
    </span>
  );
}

function ExtensionListGroup({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return <UiCommandGroup heading={label}>{children}</UiCommandGroup>;
}

ExtensionList.ItemIcon = ExtensionListItemIcon;

ExtensionList.Item = CommandItem;

ExtensionList.Group = ExtensionListGroup;

ExtensionList.Separator = () => <UiCommandSeparator />;

ExtensionList.Empty = UiCommandEmpty;

export const name = 'ExtensionList';

export default ExtensionList;
