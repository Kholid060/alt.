import { useEffect } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import {
  CommandNavigateOptions,
  useCommandNavigate,
} from '/@/hooks/useCommandRoute';

function AppEventListener() {
  const navigate = useCommandNavigate();

  useEffect(() => {
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
    const offOpenCommandJSONViewPage = preloadAPI.main.ipc.on(
      'command-window:open-command-json-view',
      (_, payload) => {
        const { extensionId, commandId } = payload;
        navigate(`/extensions/${extensionId}/${commandId}/view-json`, {
          data: payload,
        });
      },
    );
    const offOpenCommandViewPage = preloadAPI.main.ipc.on(
      'command-window:open-command-view',
      (_, payload) => {
        const { extensionId, commandId } = payload;
        navigate(`/extensions/${extensionId}/${commandId}/view`, {
          data: payload,
        });
      },
    );

    return () => {
      offInputConfig();
      offAppUpdateRoute();
      offOpenCommandViewPage();
      offOpenCommandJSONViewPage();
    };
  }, []);

  return null;
}

export default AppEventListener;
