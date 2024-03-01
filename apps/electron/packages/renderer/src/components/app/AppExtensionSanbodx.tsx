import { useEffect } from 'react';
import emitter, { MittEventHandler } from '/@/lib/mitt';

function AppExtensionSandbox() {
  useEffect(() => {
    const onExecuteCommand: MittEventHandler<'execute-command'> = ({
      commandId,
      extensionId,
    }) => {
      console.log(commandId, extensionId);
    };

    emitter.on('execute-command', onExecuteCommand);

    return () => {
      emitter.off('execute-command', onExecuteCommand);
    };
  }, []);

  return null;
}

export default AppExtensionSandbox;
