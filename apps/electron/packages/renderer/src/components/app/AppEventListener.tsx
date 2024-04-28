import { useEffect } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import {
  CommandNavigateOptions,
  useCommandNavigate,
} from '/@/hooks/useCommandRoute';
import { useCommandStore } from '/@/stores/command.store';
import { getExtIconURL, isIPCEventError } from '/@/utils/helper';
import { requireInputConfig } from '#packages/common/utils/helper';
import MessagePortListener from '../../utils/message-port';
import { MESSAGE_PORT_CHANNEL_IDS } from '#packages/common/utils/constant/constant';

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
      async (_, { commandId, extensionId, type }) => {
        const extension = await preloadAPI.main.ipc.invoke(
          'database:get-extension-manifest',
          extensionId,
        );
        if (!extension || isIPCEventError(extension)) return;

        if (type === 'extension') {
          if (!requireInputConfig(extension.config)) return;

          navigate(`/configs/${extensionId}`, {
            data: {
              config: extension.config,
            },
            panelHeader: {
              icon: extension.icon,
              title: extension.title,
            },
          });
          return;
        }

        const command = extension.commands.find(
          (command) => command.name === commandId,
        );
        if (!command || !requireInputConfig(command.config)) return;

        navigate(`/configs/${extensionId}:${command.name}`, {
          data: {
            config: command.config,
          },
          panelHeader: {
            title: command.title,
            subtitle: extension.title,
            icon: getExtIconURL(command.icon || extension.icon, extensionId),
          },
        });
      },
    );

    return () => {
      offInputConfig();
      offAppUpdateRoute();
      offWindowVisibility();
    };
  }, []);

  return null;
}

export default AppEventListener;
