import React from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import { XIcon } from 'lucide-react';
import UiExtensionIcon from '../ui/UiExtensionIcon';
import { UiList } from '@alt-dot/ui';
import { useDatabaseQuery } from '/@/hooks/useDatabase';
import { ExtensionPermissions } from '#packages/common/interface/extension.interface';
import { EXTENSION_BUILT_IN_ID } from '#packages/common/utils/constant/extension.const';
import { SelectExtensionCommand } from '#packages/main/src/db/schema/extension.schema';

function getPermissionsDescription(
  permissions: ExtensionPermissions[],
  commands: SelectExtensionCommand[],
) {
  const descriptions = new Set<string>();

  const hasScriptCommand = commands.some(
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

const builtInExtensionIds = Object.values(EXTENSION_BUILT_IN_ID) as string[];

interface ExtensionDetailCardProps {
  extensionId: string;
  onClose?: () => void;
  children?: React.ReactNode;
}

function ExtensionDetailCard({
  onClose,
  extensionId,
}: ExtensionDetailCardProps) {
  const extension = useDatabaseQuery('database:get-extension', [extensionId]);

  if (extension.state !== 'idle' || !extension.data) return null;

  const permissions = extension.data.isError
    ? []
    : getPermissionsDescription(
        extension.data.permissions ?? [],
        extension.data.commands,
      );

  return (
    <>
      <div className="flex h-[49px] items-center border-b px-4">
        <button
          className="text-muted-foreground transition hover:text-foreground"
          onClick={() => onClose?.()}
        >
          <XIcon className="h-5 w-5" />
        </button>
        <div className="ml-4 h-8 w-8">
          {extension.data.isError ? (
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
      <div className="space-y-4 p-4 text-sm text-muted-foreground">
        <div>
          <p className="text-foreground">Description</p>
          <p>{extension.data.description || '-'}</p>
        </div>
        <div>
          <p className="text-foreground">Version</p>
          <p>{extension.data.version}</p>
        </div>
        <div>
          <p className="text-foreground">Permissions</p>
          <ul className="list-inside list-disc">
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
                className="text-left leading-tight underline"
                onClick={() =>
                  extension.data!.path &&
                  preloadAPI.main.ipc.invoke(
                    'shell:open-in-folder',
                    extension.data?.path as string,
                  )
                }
              >
                {extension.data.path}
              </button>
            </p>
          ) : builtInExtensionIds.includes(extensionId) ? (
            'Built-in extesion'
          ) : (
            <a
              href={`${import.meta.env.VITE_WEB_BASE_URL}/store/extensions/${extension.data.id}`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Store
            </a>
          )}
        </div>
      </div>
    </>
  );
}

export default ExtensionDetailCard;
