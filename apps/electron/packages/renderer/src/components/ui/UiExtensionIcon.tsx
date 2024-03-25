import { commandIcons } from '#common/utils/command-icons';
import { CUSTOM_SCHEME } from '#common/utils/constant/constant';
import { UiImage } from '@repo/ui';
import { LucideIcon } from 'lucide-react';

const iconPrefix = 'icon:';
type CommandIconName = keyof typeof commandIcons;

function UiExtensionIcon({
  id,
  alt,
  icon,
  iconWrapper,
}: {
  id: string;
  alt: string;
  icon: string;
  iconWrapper?: (icon: LucideIcon) => React.ReactNode;
}) {
  if (icon.startsWith(iconPrefix)) {
    let iconName = icon.slice(iconPrefix.length) as CommandIconName;
    iconName = commandIcons[iconName] ? iconName : 'Command';

    const Icon = commandIcons[iconName] ?? icon;
    if (iconWrapper) {
      return iconWrapper(Icon);
    }

    return <Icon />;
  }

  return (
    <UiImage
      src={`${CUSTOM_SCHEME.extension}://${id}/icon/${icon}`}
      alt={alt}
    />
  );
}

export default UiExtensionIcon;