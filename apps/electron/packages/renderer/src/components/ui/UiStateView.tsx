import { LucideIcon, PackageOpenIcon, TriangleAlertIcon } from 'lucide-react';
import clsx from 'clsx';
import { UiButton } from '@alt-dot/ui';

type UiStateViewType = 'error' | 'empty';

const STATE_DATA: Record<
  UiStateViewType,
  {
    icon: LucideIcon;
    title: string;
    iconClass?: string;
    iconContainerClass?: string;
  }
> = {
  error: {
    icon: TriangleAlertIcon,
    title: 'Something went wrong',
    iconContainerClass: 'bg-destructive/10',
    iconClass: 'text-destructive-text',
  },
  empty: {
    title: 'No data',
    icon: PackageOpenIcon,
    iconContainerClass: 'bg-card',
  },
};

function UiStateView({
  type,
  icon,
  title,
  iconSlot,
  onAction,
  className,
  footerSlot,
  description,
  ...props
}: {
  title?: string;
  icon?: LucideIcon;
  description?: string;
  onAction?: () => void;
  type: UiStateViewType;
  iconSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const stateData = STATE_DATA[type];
  if (!stateData) throw new Error(`"${type}" is invalid UiStateView type`);

  const StateIcon = icon || stateData.icon;

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center',
        className,
      )}
      {...props}
    >
      <div className={clsx('p-6 rounded-full', stateData.iconContainerClass)}>
        {iconSlot || (
          <StateIcon className={clsx('h-10 w-10', stateData.iconClass)} />
        )}
      </div>
      <h3 className="mt-6 text-lg font-semibold">{title || stateData.title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-muted-foreground leading-5">
          {description}
        </p>
      )}
      {iconSlot ? (
        iconSlot
      ) : type === 'error' ? (
        <UiButton className="mt-8 w-28" variant="secondary" onClick={onAction}>
          Retry
        </UiButton>
      ) : null}
    </div>
  );
}

export default UiStateView;
