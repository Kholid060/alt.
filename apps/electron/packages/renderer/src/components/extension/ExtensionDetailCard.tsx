import React from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import { XIcon } from 'lucide-react';
import UiExtensionIcon from '../ui/UiExtensionIcon';
import { UiList } from '@repo/ui';
import { ExtensionManifest } from '@repo/extension-core';
import { useDatabaseQuery } from '/@/hooks/useDatabase';

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

interface ExtensionDetailCardProps {
  extensionId: string;
  onClose?: () => void;
  children?: React.ReactNode;
}

function ExtensionDetailCard({
  onClose,
  extensionId,
}: ExtensionDetailCardProps) {
  const extension = useDatabaseQuery({
    name: 'database:get-extension',
    args: [extensionId],
  });
  const extensionManifest = useDatabaseQuery({
    name: 'database:get-extension-manifest',
    args: [extensionId],
  });

  if (
    extensionManifest.state !== 'idle' ||
    extension.state !== 'idle' ||
    !extensionManifest.data ||
    !extension.data
  )
    return null;

  const permissions = extensionManifest.data.isError
    ? []
    : getPermissionsDescription(extensionManifest.data.manifest);

  return (
    <>
      <div className="flex items-center h-[49px] px-4 border-b">
        <button
          className="text-muted-foreground hover:text-foreground transition"
          onClick={() => onClose?.()}
        >
          <XIcon className="h-5 w-5" />
        </button>
        <div className="h-8 w-8 ml-4">
          {extensionManifest.data.isError ? (
            <UiList.Icon icon={extension.data.title[0].toUpperCase()} />
          ) : (
            <UiExtensionIcon
              alt={`${extension.data.title} icon`}
              id={extension.data.id}
              icon={extension.data.icon}
              iconWrapper={(icon) => <UiList.Icon icon={icon} />}
            />
          )}
        </div>
        <p className="ml-2 line-clamp-1">{extension.data.title}</p>
      </div>
      <div className="p-4 text-sm space-y-4 text-muted-foreground">
        <div>
          <p className="text-foreground">Description</p>
          <p>{extension.data.description}</p>
        </div>
        <div>
          <p className="text-foreground">Version</p>
          <p>{extension.data.version}</p>
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
          {extension.data.isLocal ? (
            <p>
              Loaded from:{' '}
              <button
                className="underline text-left leading-tight"
                onClick={() =>
                  extension.data!.path &&
                  preloadAPI.main.invokeIpcMessage(
                    'shell:open-in-folder',
                    extension.data?.path as string,
                  )
                }
              >
                {extension.data.path}
              </button>
            </p>
          ) : (
            'Marketplace'
          )}
        </div>
      </div>
    </>
  );
}

export default ExtensionDetailCard;
