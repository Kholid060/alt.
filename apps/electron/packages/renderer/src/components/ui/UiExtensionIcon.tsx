import { CUSTOM_SCHEME } from '#common/utils/constant/constant';
import { UiIcons, UiImage } from '@altdot/ui';
import { LucideIcon, TriangleAlertIcon } from 'lucide-react';
import { useState } from 'react';

const iconPrefix = 'icon:';

function UiExtensionIcon({
  id,
  alt,
  icon,
  iconWrapper,
  extensionIcon = true,
}: {
  id: string;
  alt: string;
  icon: string;
  extensionIcon?: boolean;
  iconWrapper?: (icon: LucideIcon) => React.ReactNode;
}) {
  const [imageError, setImageError] = useState(false);

  if (icon.startsWith(iconPrefix)) {
    let iconName = icon.slice(iconPrefix.length) as keyof typeof UiIcons;
    iconName = UiIcons[iconName] ? iconName : 'Command';

    const Icon = UiIcons[iconName] ?? icon;
    if (iconWrapper) {
      return iconWrapper(Icon);
    }

    return <Icon />;
  }

  if (imageError) {
    return iconWrapper ? iconWrapper(TriangleAlertIcon) : <TriangleAlertIcon />;
  }

  return (
    <UiImage
      src={
        extensionIcon ? `${CUSTOM_SCHEME.extension}://${id}/icon/${icon}` : icon
      }
      onError={() => setImageError(true)}
      alt={alt}
    />
  );
}

export default UiExtensionIcon;
