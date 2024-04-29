import { useEffect } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import {
  CommandNavigateOptions,
  useCommandNavigate,
} from '/@/hooks/useCommandRoute';
import { useCommandStore } from '/@/stores/command.store';

function AppEventListener() {
  const setCommandStoreState = useCommandStore((state) => state.setState);

  const navigate = useCommandNavigate();

  useEffect(() => {
    const offWindowVisibility = preloadAPI.main.ipc.on(
      'window:visibility-change',
      (_, isHidden) => {
        if (!isHidden) {
          const inputEl = document.getElementById(
            'input-query',
          ) as HTMLInputElement;
          inputEl?.focus();
          inputEl?.select();
        }

        setCommandStoreState('isWindowHidden', isHidden);
      },
    );
    const offAppUpdateRoute = preloadAPI.main.ipc.on(
      'app:update-route',
      (_, path, routeData) => {
        navigate(path, routeData as CommandNavigateOptions);
      },
    );
    const offInputConfig = preloadAPI.main.ipc.on(
      'command-window:input-config',
      async (_, { commandId, extensionId, type, executeCommandPayload }) => {
        const configId =
          type === 'extension' ? extensionId : `${extensionId}:${commandId}`;
        navigate(`/configs/${configId}`, { data: { executeCommandPayload } });
      },
    );
    const offOpenJSONViewPage = preloadAPI.main.ipc.on(
      'command-window:open-json-view',
      (_, payload) => {
        const { extensionId, commandId } = payload;
        navigate(`/extensions/${extensionId}/${commandId}/view-json`, {
          data: payload,
        });
      },
    );

    return () => {
      offInputConfig();
      offAppUpdateRoute();
      offWindowVisibility();
      offOpenJSONViewPage();
    };
  }, []);

  return null;
}

export default AppEventListener;
