import { useEffect, useRef, useState } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import { ExtensionCredential } from '@alt-dot/extension-core/src/client/manifest/manifest-credential';
import { ArrowLeftIcon } from 'lucide-react';
import UiExtensionIcon from '../ui/UiExtensionIcon';
import { UiButton } from '@alt-dot/ui';

type ExtensionCredentialDetail = ExtensionCredential & {
  commandId: string;
  hasValue: boolean;
  extensionId: string;
  extensionTitle: string;
  credentialName: string;
};

const OVERLAY_TIMEOUT_MS = 600_000; // 10 minutes

function CommandOAuthOverlay() {
  const resolverRef = useRef<{
    commandId: string;
    extensionId: string;
    resolver: PromiseWithResolvers<boolean>;
  } | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | number>(-1);

  const [credential, setCredential] =
    useState<null | ExtensionCredentialDetail>(null);

  useEffect(() =>
    preloadAPI.main.ipc.handle(
      'command-window:show-oauth-overlay',
      (credentialProvider, detail) => {
        setCredential({
          ...credentialProvider,
          ...detail,
        });

        if (resolverRef.current) {
          const { commandId, extensionId, resolver } = resolverRef.current;
          if (
            commandId === detail.commandId &&
            extensionId === detail.extensionId
          ) {
            return resolver.promise;
          }

          resolver.resolve(false);
        }

        resolverRef.current = {
          ...detail,
          resolver: Promise.withResolvers(),
        };

        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          resolverRef.current?.resolver.resolve(false);
          setCredential(null);
          resolverRef.current = null;
        }, OVERLAY_TIMEOUT_MS);

        return resolverRef.current.resolver.promise;
      },
    ),
  );
  useEffect(() => {
    const keydownEvent = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      event.preventDefault();
      event.stopPropagation();

      resolverRef.current?.resolver.resolve(false);

      setCredential(null);
      resolverRef.current = null;
    };
    if (credential) {
      window.addEventListener('keydown', keydownEvent, true);
    }

    return () => {
      window.removeEventListener('keydown', keydownEvent, true);
    };
  }, [credential]);
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  });

  if (!credential) return null;

  function onClose(type: 'submit' | 'cancel') {
    if (!resolverRef.current) return;

    resolverRef.current?.resolver.resolve(type === 'submit');
    setCredential(null);
    resolverRef.current = null;
  }

  return (
    <div className="h-full w-full absolute z-50 top-0 left-0 bg-background rounded-lg flex flex-col overflow-hidden">
      <div className="h-14 flex items-center px-4 border-b flex-shrink-0">
        <button
          className="h-8 w-8 inline-flex items-center justify-center mr-2 text-muted-foreground flex-shrink-0"
          onClick={() => onClose('cancel')}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4 flex-grow overflow-auto">
        <div className="py-8 text-center">
          <div className="h-14 w-14 inline-block">
            <UiExtensionIcon
              id={credential.extensionId}
              alt={credential.providerName}
              icon={credential.providerIcon}
            />
          </div>
          <h2 className="text-lg font-semibold mt-2 leading-tight">
            {credential.credentialName}
          </h2>
          <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
            Connect your {credential.providerName} account
          </p>
          <UiButton
            size="sm"
            className="min-w-36 mt-6"
            onClick={() => onClose('submit')}
          >
            Connect account
          </UiButton>
        </div>
      </div>
    </div>
  );
}

export default CommandOAuthOverlay;
