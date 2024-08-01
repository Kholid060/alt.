import { CUSTOM_SCHEME } from '#common/utils/constant/constant';
import { UiIcons, UiImage } from '@altdot/ui';
import { LucideIcon, TriangleAlertIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { useIsDarkTheme } from '/@/hooks/useTheme';

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
  const isDarkTheme = useIsDarkTheme();

  const hasTriedDarkIcon = useRef(false);

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
        extensionIcon
          ? `${CUSTOM_SCHEME.extension}://${id}/icon/${isDarkTheme && !hasTriedDarkIcon.current ? `${icon}@dark` : icon}`
          : icon
      }
      onError={(event) => {
        const target = event.target as HTMLImageElement;
        if (isDarkTheme) {
          if (target.src.includes('@dark')) {
            target.src = target.src.replaceAll('@dark', '');
            hasTriedDarkIcon.current = true;
          } else if (!hasTriedDarkIcon.current) {
            target.src = target.src + '@dark';
            hasTriedDarkIcon.current = true;
          } else {
            setImageError(true);
          }
        } else if (target.src.includes('@dark')) {
          target.src = target.src.replaceAll('@dark', '');
        } else {
          setImageError(true);
        }
      }}
      alt={alt}
    />
  );
}

export default UiExtensionIcon;
