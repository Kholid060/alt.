import { createContext, useRef, useState } from 'react';

export interface CommandPanelStatus {
  title: string;
  timeout?: number;
  type: 'loading' | 'error' | 'success';
}

export interface CommandPanelHeader {
  icon?: string;
  title: string;
  subtitle?: string;
}

interface CommandPanelState {
  header: CommandPanelHeader | null;
  status: CommandPanelStatus | null;
  setPanelStatus(payload: CommandPanelStatus): void;
}

export const commandPanelCtx = createContext<CommandPanelState>({
  header: null,
  status: null,
  setPanelStatus() {
    throw new Error('Not implemented');
  },
});

export function CommandPanelProvider({}: { children: React.ReactNode }) {
  const statusTimeout = useRef<NodeJS.Timeout | number>(-1);

  const [header, setHeader] = useState<CommandPanelHeader | null>(null);
  const [status, setStatus] = useState<CommandPanelStatus | null>(null);

  function setPanelStatus(payload: CommandPanelStatus) {
    clearTimeout(statusTimeout.current);
    if (payload.timeout) {
      statusTimeout.current = setTimeout(() => {
        setStatus(null);
      }, payload.timeout);
    }

    setStatus(payload);
  }

  return null;
}
