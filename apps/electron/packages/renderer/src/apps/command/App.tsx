import {
  UiButton,
  UiTooltipProvider,
  UiListProvider,
  DialogProvider,
} from '@altdot/ui';
import CommandHeader from '/@/components/command/CommandHeader';
import CommandFooter from '/@/components/command/CommandFooter';
import CommandContent from '/@/components/command/CommandContent';
import { CommandCtxProvider } from '/@/context/command.context';
import {
  CommandRouteProvider,
  createCommandRoutes,
} from '/@/context/command-route.context';
import CommandErrorOverlay from '/@/components/command/CommandErrorOverlay';
import AppDevtools from '/@/components/app/AppDevtools';
import AppEventListener from '/@/components/app/AppEventListener';
import { DatabaseProvider } from '/@/context/database.context';
import {
  FallbackProps,
  ErrorBoundary as ReactErrorBoundary,
} from 'react-error-boundary';
import { commandAppRoutes } from './routes';
import { useCommandStore } from '/@/stores/command.store';
import { useEffect, useRef, useState } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import CommandOAuthOverlay from '/@/components/command/CommandOAuthOverlay';
import IdleTimer from '#packages/common/utils/IdleTimer';
import { useCommandNavigate } from '/@/hooks/useCommandRoute';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { isIPCEventError } from '#packages/common/utils/helper';
import { ExtensionBrowserTabContext } from '#packages/common/interface/extension.interface';
import { debounce } from '@altdot/shared';
import { ThemeProvider } from '/@/context/theme.context';

const routes = createCommandRoutes(commandAppRoutes);

// @ts-expect-error for later
// eslint-disable-next-line
const getBrowserTabCtx = (() => {
  let cache: { tab: ExtensionBrowserTabContext; fetchedAt: number } | null =
    null;
  let isFetching = false;

  return () => {
    if (cache && cache.tab && Date.now() - cache.fetchedAt < 5000) {
      return Promise.resolve(cache.tab);
    }
    if (isFetching) return Promise.reject('Fetching');

    isFetching = true;

    return preloadAPI.main.ipc
      .invoke('browser:get-active-tab')
      .then((result) => {
        if (isIPCEventError(result)) throw new Error(result.message);

        cache = {
          tab: result,
          fetchedAt: Date.now(),
        };

        return result;
      })
      .catch(console.error)
      .finally(() => {
        isFetching = false;
      });
  };
})();

function ErrorBoundaryFallback({ error }: FallbackProps) {
  return (
    <div className="h-full w-full rounded-lg border bg-background p-4">
      <div className="flex items-start">
        <p className="flex-1 gap-4 font-semibold text-destructive-text">
          {error.message}
        </p>
        <UiButton
          size="sm"
          variant="secondary"
          onClick={() => window.location.reload()}
        >
          Reload
        </UiButton>
      </div>
      <div className="mt-4 overflow-auto whitespace-pre-wrap rounded-lg bg-card p-4 font-mono text-sm text-muted-foreground">
        {error.stack}
      </div>
    </div>
  );
}
function IdleListener({
  onToggleHide,
}: {
  onToggleHide: (hide: boolean) => void;
}) {
  const navigate = useCommandNavigate();
  const setCommandStoreState = useCommandStore((state) => state.setState);

  useEffect(() => {
    const onIdle = () => {
      navigate('');
      useCommandStore.getState().$reset();
      useCommandPanelStore.getState().$reset();

      onToggleHide(true);
    };
    IdleTimer.instance.on('idle', onIdle);

    const offWindowVisibility = preloadAPI.main.ipc.on(
      'window:visibility-change',
      debounce((_, isHidden) => {
        if (!isHidden) {
          const inputEl = document.getElementById(
            'input-query',
          ) as HTMLInputElement;
          inputEl?.focus();
          inputEl?.select();

          IdleTimer.instance.stop();
          onToggleHide(false);

          // getBrowserTabCtx().then((tabCtx) => {
          //   tabCtx && setCommandStoreState('activeBrowserTab', tabCtx);
          // });
        } else {
          preloadAPI.main.ipc
            .invokeWithError('app:get-settings', 'clearStateAfter')
            .then((result) => {
              if (typeof result !== 'number') return;

              IdleTimer.instance.start(result * 60 * 1000);
            })
            .catch(console.error);
        }

        setCommandStoreState('isWindowHidden', isHidden);
      }, 200),
    );

    return () => {
      offWindowVisibility();
      IdleTimer.instance.on('idle', onIdle);
    };
  }, [navigate, onToggleHide, setCommandStoreState]);

  return null;
}

function App() {
  const contentRef = useRef<HTMLDivElement>(null);
  const dialogFocusRef = useRef<Element | HTMLElement | null>(null);

  const [hide, setHide] = useState(false);

  useEffect(() => {
    const onVisibilityChange = () => {
      const { isWindowHidden } = useCommandStore.getState();
      if (!isWindowHidden && document.visibilityState === 'hidden') {
        preloadAPI.main.ipc.invoke('command-window:close');
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return (
    <ReactErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
      <ThemeProvider>
        <UiTooltipProvider>
          <DatabaseProvider>
            <CommandRouteProvider routes={routes}>
              <IdleListener
                onToggleHide={(value) => value !== hide && setHide(value)}
              />
              {!hide && (
                <DialogProvider
                  dialogOptions={{
                    containerEl: contentRef,
                    class: {
                      title: 'text-base',
                      content: 'p-4 absolute',
                      overlay: 'absolute rounded-lg',
                    },
                  }}
                  options={{
                    onDialogAdded() {
                      dialogFocusRef.current ??= document.activeElement;
                    },
                    onAllClosed() {
                      if (
                        dialogFocusRef.current &&
                        'focus' in dialogFocusRef.current
                      ) {
                        dialogFocusRef.current.focus();
                      }
                      dialogFocusRef.current = null;
                    },
                  }}
                >
                  <CommandCtxProvider>
                    <AppEventListener />
                    <div className="overflow-hidden p-0.5">
                      <UiListProvider>
                        <AppDevtools />
                        <div
                          ref={contentRef}
                          id="command-content-container"
                          className="relative z-10 w-full rounded-lg border bg-background"
                        >
                          <CommandHeader />
                          <CommandContent />
                          <CommandErrorOverlay />
                          <CommandOAuthOverlay />
                        </div>
                      </UiListProvider>
                      <CommandFooter />
                    </div>
                  </CommandCtxProvider>
                </DialogProvider>
              )}
            </CommandRouteProvider>
          </DatabaseProvider>
        </UiTooltipProvider>
      </ThemeProvider>
    </ReactErrorBoundary>
  );
}

export default App;
