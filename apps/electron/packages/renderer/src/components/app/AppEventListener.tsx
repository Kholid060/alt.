import { useEffect } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import {
  CommandNavigateOptions,
  useCommandNavigate,
} from '/@/hooks/useCommandRoute';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { useCommandStore } from '/@/stores/command.store';
import { getExtIconURL } from '/@/utils/helper';
import { requireInputConfig } from '#packages/common/utils/helper';

function AppEventListener() {
  const clearPanel = useCommandPanelStore.use.clearAll();
  const setCommandStoreState = useCommandStore((state) => state.setState);

  const navigate = useCommandNavigate();

  useEffect(() => {
    const offWindowVisibility = preloadAPI.main.ipcMessage.on(
      'window:visibility-change',
      (_, isHidden) => {
        if (!isHidden) {
          document.getElementById('input-query')?.focus();
          navigate('');
          clearPanel();
        }

        setCommandStoreState('isWindowHidden', isHidden);
      },
    );
    const offAppUpdateRoute = preloadAPI.main.ipcMessage.on(
      'app:update-route',
      (_, path, routeData) => {
        navigate(path, routeData as CommandNavigateOptions);
      },
    );
    const offInputConfig = preloadAPI.main.ipcMessage.on(
      'command-window:input-config',
      async (_, { commandId, extensionId, type }) => {
        const extension = await preloadAPI.main.invokeIpcMessage(
          'extension:get',
          extensionId,
        );
        if (!extension || '$isError' in extension || extension.isError) return;

        if (type === 'extension') {
          if (!requireInputConfig(extension.manifest.config)) return;

          navigate(`/configs/${extension.id}`, {
            data: {
              config: extension.manifest.config,
            },
            panelHeader: {
              title: extension.title,
              icon: extension.manifest.icon,
            },
          });
          return;
        }

        const command = extension.manifest.commands.find(
          (command) => command.name === commandId,
        );
        if (!command || !requireInputConfig(command.config)) return;

        navigate(`/configs/${extension.id}:${command.name}`, {
          data: {
            config: command.config,
          },
          panelHeader: {
            title: command.title,
            subtitle: extension.title,
            icon: getExtIconURL(command.icon || extension.icon, extension.id),
          },
        });
      },
    );

    return () => {
      offInputConfig?.();
      offAppUpdateRoute?.();
      offWindowVisibility?.();
    };
  }, []);

  return null;
}

export default AppEventListener;
