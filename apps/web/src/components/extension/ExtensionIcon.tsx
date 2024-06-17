import { UiExtIcon } from '@alt-dot/extension';
import { UiImage } from '@alt-dot/ui';
import clsx from 'clsx';

function ExtensionIcon({
  icon,
  title,
  iconUrl,
  svgClass,
  className,
  imageClass,
}: {
  icon: string;
  title: string;
  iconUrl: string;
  svgClass?: string;
  className?: string;
  imageClass?: string;
}) {
  if (icon.startsWith('icon:')) {
    const Icon =
      UiExtIcon[icon.split(':')[1] as keyof typeof UiExtIcon] ??
      UiExtIcon.Command;

    return (
      <div className="p-2 rounded-md border bg-card border-border/40 text-muted-foreground inline-block">
        <Icon className={clsx(svgClass, className)} />
      </div>
    );
  }

  return (
    <UiImage src={iconUrl} className={clsx(imageClass)} alt={`${title} icon`} />
  );
}

export default ExtensionIcon;
