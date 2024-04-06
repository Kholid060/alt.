import { useEffect } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import { useCommandNavigate } from '/@/hooks/useCommandRoute';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { useCommandStore } from '/@/stores/command.store';

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

    return () => {
      offWindowVisibility?.();
    };
  }, []);

  return null;
}

export default AppEventListener;
