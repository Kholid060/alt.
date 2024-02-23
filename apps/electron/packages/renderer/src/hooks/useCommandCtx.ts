import { useContext } from 'react';
import { CommandContext } from '../context/command.context';

export function useCommandCtx() {
  const context = useContext(CommandContext);

  return context;
}
