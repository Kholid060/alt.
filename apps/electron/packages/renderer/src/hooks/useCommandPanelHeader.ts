import { useEffect } from 'react';
import {
  CommandPanelHeader,
  useCommandPanelStore,
} from '../stores/command-panel.store';

export function useCommandPanelHeader(header: CommandPanelHeader) {
  const setHeader = useCommandPanelStore.use.setHeader();

  useEffect(() => {
    setHeader(header);

    return () => {
      setHeader(null);
    };
  }, []);
}
