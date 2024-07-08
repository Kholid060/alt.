import { useEffect, useRef, useState } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import { ExtensionCredential } from '@altdot/extension-core/src/client/manifest/manifest-credential';
import { ArrowLeftIcon } from 'lucide-react';
import UiExtensionIcon from '../ui/UiExtensionIcon';
import { UiButton } from '@altdot/ui';

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
    <div className="absolute left-0 top-0 z-50 flex h-full w-full flex-col overflow-hidden rounded-lg bg-background">
      <div className="flex h-14 flex-shrink-0 items-center border-b px-4">
        <button
          className="mr-2 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center text-muted-foreground"
          onClick={() => onClose('cancel')}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-grow overflow-auto p-4">
        <div className="py-8 text-center">
          <div className="inline-block h-14 w-14">
            <UiExtensionIcon
              id={credential.extensionId}
              alt={credential.providerName}
              icon={credential.providerIcon}
            />
          </div>
          <h2 className="mt-2 text-lg font-semibold leading-tight">
            {credential.credentialName}
          </h2>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            Connect your {credential.providerName} account
          </p>
          <UiButton
            size="sm"
            className="mt-6 min-w-36"
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
