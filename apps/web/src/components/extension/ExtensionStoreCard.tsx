import { useNativeApp } from '@/hooks/useNativeApp';
import { ExtensionStoreListItem } from '@/interface/extension.interface';
import {
  UiCard,
  UiCardHeader,
  UiButton,
  UiCardContent,
  UiCardFooter,
  UiAvatar,
  UiAvatarImage,
  UiAvatarFallback,
} from '@altdot/ui';
import { ShareIcon, UserRoundIcon, CpuIcon, DownloadIcon } from 'lucide-react';
import { ExtensionDetailIcon } from './ExtensionDetail';
import { Link } from '@tanstack/react-router';

const numberFormatter = new Intl.NumberFormat();
function ExtensionStoreCard({
  extension,
  disabledOwnerLink,
}: {
  disabledOwnerLink?: boolean;
  extension: ExtensionStoreListItem;
}) {
  const { installExtension } = useNativeApp();

  return (
    <UiCard className="flex flex-col">
      <UiCardHeader className="flex-1 flex-row items-center justify-between space-y-0 p-4">
        <ExtensionDetailIcon
          imageClass="size-10 aspect-square rounded-sm object-cover object-center"
          icon={extension.iconUrl}
          iconUrl={extension.iconUrl}
          title={`${extension.title} icon`}
        />
        <button
          className="md:hidden"
          onClick={() =>
            navigator.share({
              url: `/store/extensions/${extension.name}/${extension.id}`,
            })
          }
        >
          <ShareIcon className="size-5" />
        </button>
        <UiButton
          variant="secondary"
          className="hidden md:inline-block"
          onClick={() => installExtension(extension.id)}
        >
          Install
        </UiButton>
      </UiCardHeader>
      <UiCardContent className="p-4 pt-0">
        <Link
          to="/store/extensions/$extensionName/$extensionId"
          params={{ extensionId: extension.id, extensionName: extension.name }}
        >
          <p className="line-clamp-1 font-semibold">{extension.title}</p>
          <p className="line-clamp-2 text-sm leading-tight text-muted-foreground">
            {extension.description}
          </p>
        </Link>
      </UiCardContent>
      <UiCardFooter className="items-end p-4 pt-0 text-sm text-muted-foreground">
        <div className="flex-grow">
          <Link
            disabled={disabledOwnerLink}
            to="/u/$username/extensions"
            params={{ username: extension.owner.username! }}
            className="line-clamp-1 transition-colors hover:text-foreground"
          >
            <UiAvatar className="inline-block size-4 align-middle">
              {extension.owner.avatarUrl && (
                <UiAvatarImage loading="lazy" src={extension.owner.avatarUrl} />
              )}
              <UiAvatarFallback>
                <UserRoundIcon className="size-4" />
              </UiAvatarFallback>
            </UiAvatar>
            <span className="ml-1.5 align-middle">{extension.owner.name}</span>
          </Link>
        </div>
        <span title="Commands count" className="hidden flex-shrink-0 md:block">
          <CpuIcon className="inline-block size-5 align-middle" />
          <span className="ml-1 align-middle">{extension.commands.length}</span>
        </span>
        <span title="Downloads count" className="ml-2 flex-shrink-0 lg:ml-3">
          <DownloadIcon className="inline-block size-5 align-middle" />
          <span className="ml-1 align-middle">
            {numberFormatter.format(extension.downloadCount)}
          </span>
        </span>
      </UiCardFooter>
    </UiCard>
  );
}

export default ExtensionStoreCard;
