import { useEffect } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import {
  CommandNavigateOptions,
  useCommandNavigate,
} from '/@/hooks/useCommandRoute';
import { MessagePortListener } from '/@/utils/ExtensionRendererMessagePort';

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
      'command-window:open-json-view',
      (_, payload) => {
        const { extensionId, commandId } = payload.detail;
        navigate(`/extensions/${extensionId}/${commandId}/view-json`, {
          data: payload,
        });
      },
    );
    const offOpenCommandViewPage = MessagePortListener.on(
      'command-window:open-view',
      (event) => {
        const payload = event.data;
        navigate(
          `/extensions/${payload.extensionId}/${payload.commandId}/view`,
          {
            data: {
              payload,
              port: event.ports[0],
            },
          },
        );
      },
    );
    // const offOpenCommandViewPage = preloadAPI.main.ipc.on(
    //   'command-window:open-view',
    //   (_, payload) => {
    //     const { extensionId, commandId } = payload;
    //     navigate(`/extensions/${extensionId}/${commandId}/view`, {
    //       data: payload,
    //     });
    //   },
    // );

    return () => {
      offInputConfig();
      offAppUpdateRoute();
      offOpenCommandViewPage();
      offOpenCommandJSONViewPage();
    };
  }, [navigate]);

  return null;
}

export default AppEventListener;
