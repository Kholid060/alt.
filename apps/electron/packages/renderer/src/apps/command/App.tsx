import { UiTooltipProvider } from '@repo/ui';
import CommandHeader from '/@/components/command/CommandHeader';
import CommandFooter from '/@/components/command/CommandFooter';
import CommandContent from '/@/components/command/CommandContent';
import { CommandCtxProvider } from '/@/context/command.context';
import { UiListProvider } from '@repo/ui/dist/context/list.context';
import {
  CommandRouteProvider,
  createCommandRoutes,
} from '/@/context/command-route.context';
import CommandErrorOverlay from '/@/components/command/CommandErrorOverlay';
import AppDevtools from '/@/components/app/AppDevtools';
import AppEventListener from '/@/components/app/AppEventListener';
import { DatabaseProvider } from '/@/context/database.context';
import { commandAppRoutes } from './routes';
import { useCommandStore } from '/@/stores/command.store';
import { useEffect, useState } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import CommandOAuthOverlay from '/@/components/command/CommandOAuthOverlay';
import IdleTimer from '#packages/common/utils/IdleTimer';
import { useCommandNavigate } from '/@/hooks/useCommandRoute';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { isIPCEventError } from '#packages/common/utils/helper';
import { ExtensionBrowserTabContext } from '#packages/common/interface/extension.interface';
import { debounce } from '@repo/shared';

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
  }, []);

  return null;
}

function App() {
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
    <UiTooltipProvider>
      <DatabaseProvider>
        <CommandRouteProvider routes={routes}>
          <IdleListener
            onToggleHide={(value) => value !== hide && setHide(value)}
          />
          {!hide && (
            <CommandCtxProvider>
              <AppEventListener />
              <div className="p-0.5">
                <UiListProvider>
                  <AppDevtools />
                  <div className="bg-background border rounded-lg w-full z-10 relative">
                    <CommandHeader />
                    <CommandContent />
                    <CommandErrorOverlay />
                    <CommandOAuthOverlay />
                  </div>
                </UiListProvider>
                <CommandFooter />
              </div>
            </CommandCtxProvider>
          )}
        </CommandRouteProvider>
      </DatabaseProvider>
    </UiTooltipProvider>
  );
}

export default App;
