import { useEffect, useState } from 'react';
import emitter, { MittEventHandler } from '/@/lib/mitt';
import CommandExtensionContent from '../command/CommandExtensionContent';

interface CommandExecution {
  timerId: number;
  commandId: string;
  extensionId: string;
}

function AppExtensionSandbox() {
  const [execute, setExecute] = useState<null | CommandExecution>(null);

  useEffect(() => {
    const onExecuteCommand: MittEventHandler<'execute-command'> = ({
      commandId,
      extensionId,
    }) => {
      setExecute({ commandId, extensionId, timerId: 0 });
    };

    emitter.on('execute-command', onExecuteCommand);

    return () => {
      emitter.off('execute-command', onExecuteCommand);
    };
  }, []);

  if (!execute) return null;

  return (
    <CommandExtensionContent
      type="action"
      commandId={execute.commandId}
      extensionId={execute.extensionId}
      onFinishExecute={() => setExecute(null)}
    />
  );
}

export default AppExtensionSandbox;
