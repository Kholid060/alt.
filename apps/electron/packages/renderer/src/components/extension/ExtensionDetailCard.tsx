import { ExtensionData } from '#packages/common/interface/extension.interface';
import { useEffect, useState } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import { XIcon } from 'lucide-react';
import UiExtensionIcon from '../ui/UiExtensionIcon';
import { UiList } from '@repo/ui';
import { ExtensionManifest } from '@repo/extension-core';

function getPermissionsDescription(manifest: ExtensionManifest) {
  const descriptions = new Set<string>();
  const permissions = manifest.permissions ?? [];

  const hasScriptCommand = manifest.commands.some(
    (command) => command.type === 'script',
  );
  if (hasScriptCommand) {
    descriptions.add('Execute a script');
  }

  permissions.forEach((permission) => {
    switch (permission) {
      case 'clipboard':
        descriptions.add('Read and write the clipboard data');
        break;
      case 'notifications':
        descriptions.add('Display notification');
        break;
      case 'fs.read': {
        if (permissions.includes('fs')) break;

        descriptions.add('Read your local file');
        break;
      }
      case 'fs.write': {
        if (permissions.includes('fs')) break;

        descriptions.add('Write your local file');
        break;
      }
      case 'fs':
        descriptions.add('Read and write your local file');
        break;
      case 'browser.activeTab':
        descriptions.add('Access the active tab of a browser');
        break;
    }
  });

  return [...descriptions];
}

interface ExtensoinDetailCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  extensionId: string;
  onClose?: () => void;
}

function ExtensionDetailCard({
  onClose,
  extensionId,
  ...props
}: ExtensoinDetailCardProps) {
  const [extension, setExtension] = useState<ExtensionData | null>(null);

  useEffect(() => {
    preloadAPI.main
      .invokeIpcMessage('extension:get', extensionId)
      .then((extensionData) => {
        if (!extensionData || '$isError' in extensionData) return;

        setExtension(extensionData);
      });
  }, [extensionId]);

  if (!extension) return null;

  const permissions = extension.isError
    ? []
    : getPermissionsDescription(extension.manifest);

  return (
    <div {...props}>
      <div className="flex items-center h-[49px] px-4 border-b">
        <button
          className="text-muted-foreground hover:text-foreground transition"
          onClick={() => onClose?.()}
        >
          <XIcon className="h-5 w-5" />
        </button>
        <div className="h-8 w-8 ml-4">
          {extension.isError ? (
            <UiList.Icon icon={extension.title[0].toUpperCase()} />
          ) : (
            <UiExtensionIcon
              alt={`${extension.title} icon`}
              id={extension.id}
              icon={extension.manifest.icon}
              iconWrapper={(icon) => <UiList.Icon icon={icon} />}
            />
          )}
        </div>
        <p className="ml-2 line-clamp-1">{extension.title}</p>
      </div>
      <div className="p-4 text-sm space-y-4 text-muted-foreground">
        <div>
          <p className="text-foreground">Description</p>
          <p>{extension.description}</p>
        </div>
        <div>
          <p className="text-foreground">Version</p>
          <p>{extension.version}</p>
        </div>
        <div>
          <p className="text-foreground">Permissions</p>
          <ul className="list-disc list-inside">
            {permissions.map((permission, index) => (
              <li key={index}>{permission}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-foreground">Source</p>
          {extension.isLocal ? (
            <p>
              Loaded from:{' '}
              <button
                className="underline text-left leading-tight"
                onClick={() =>
                  extension.path &&
                  preloadAPI.main.invokeIpcMessage(
                    'shell:open-in-folder',
                    extension.path,
                  )
                }
              >
                {extension.path}
              </button>
            </p>
          ) : (
            'Marketplace'
          )}
        </div>
      </div>
    </div>
  );
}

export default ExtensionDetailCard;
