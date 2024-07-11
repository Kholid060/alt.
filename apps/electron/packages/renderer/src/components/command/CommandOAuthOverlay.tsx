import { useEffect, useState } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import {
  ArrowLeftIcon,
  ArrowRightLeftIcon,
  CircleCheckBigIcon,
} from 'lucide-react';
import UiExtensionIcon from '../ui/UiExtensionIcon';
import { UiButton, UiLogo } from '@altdot/ui';
import { IPCSendEventMainToRenderer } from '#packages/common/interface/ipc-events.interface';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { useUiListStore } from '@altdot/ui';

function CommandOAuthOverlay() {
  const uiListStore = useUiListStore();
  const addPanelStatus = useCommandPanelStore.use.addStatus();

  const [credential, setCredential] = useState<
    | null
    | (IPCSendEventMainToRenderer['command-window:show-oauth-overlay'][0] & {
        connected: boolean;
      })
  >(null);

  function copyAuthLink() {
    if (!credential?.authUrl) return;

    preloadAPI.main.ipc
      .invoke('clipboard:copy', credential.authUrl)
      .then(() => {
        addPanelStatus({
          type: 'success',
          title: 'Copied to clipboard',
        });
      });
  }

  useEffect(() => {
    const offAuthOverlay = preloadAPI.main.ipc.on(
      'command-window:show-oauth-overlay',
      (_, payload) => {
        if (uiListStore.snapshot().search.trim()) {
          uiListStore.setState('search', '');
        }

        setCredential({ ...payload, connected: false });
      },
    );
    const offAuthSuccess = preloadAPI.main.ipc.on(
      'command-window:oauth-success',
      (_, sessionId) => {
        setCredential((value) => {
          if (!value || value.sessionId !== sessionId) return value;

          return {
            ...value,
            connected: true,
          };
        });
      },
    );

    return () => {
      offAuthSuccess();
      offAuthOverlay();
    };
  }, [uiListStore]);
  useEffect(() => {
    const keydownEvent = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      event.preventDefault();
      event.stopPropagation();

      setCredential(null);
    };
    if (credential) {
      window.addEventListener('keydown', keydownEvent, true);
    }

    return () => {
      window.removeEventListener('keydown', keydownEvent, true);
    };
  }, [credential]);

  if (!credential) return null;

  return (
    <div className="absolute left-0 top-0 z-50 flex h-full w-full flex-col overflow-hidden rounded-lg bg-background">
      <div className="flex h-14 flex-shrink-0 items-center border-b px-4">
        <button
          className="mr-2 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center text-muted-foreground"
          onClick={() => setCredential(null)}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-grow items-center justify-center overflow-auto px-4 py-8 text-center">
        <div className="flex items-center justify-center gap-1">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-lg border">
            <UiLogo className="text-3xl" />
          </div>
          {credential.connected ? (
            <CircleCheckBigIcon className="size-5 text-green-400" />
          ) : (
            <ArrowRightLeftIcon className="size-5 text-muted-foreground" />
          )}
          <div className="inline-block h-16 w-16 rounded-lg border p-1.5">
            <UiExtensionIcon
              id={credential.extension.id}
              alt={credential.provider.name}
              icon={credential.provider.icon}
            />
          </div>
        </div>
        <h2 className="mt-5 text-lg font-semibold leading-tight">
          Connect {credential.provider.name} to <UiLogo />
        </h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
          {credential.connected ? (
            'Account connected'
          ) : (
            <>
              {credential.extension.title} extension needs to connect your{' '}
              {credential.provider.name} account to <UiLogo />
            </>
          )}
        </p>
        {!credential.connected && (
          <>
            <UiButton
              size="sm"
              className="mt-8 min-w-36"
              variant="secondary"
              onClick={() =>
                preloadAPI.main.ipc.invoke('shell:open-url', credential.authUrl)
              }
            >
              Connect account
            </UiButton>
            <p className="mt-4 text-sm text-muted-foreground">
              or{' '}
              <button className="text-violet-11" onClick={copyAuthLink}>
                copy authorization link
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default CommandOAuthOverlay;
